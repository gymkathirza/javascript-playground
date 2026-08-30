import { useCallback, useEffect, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, highlightActiveLine, lineNumbers } from "@codemirror/view";
import { addFile, addFolder, starterVfs, writeFile, type FileExt, type Vfs } from "./lib/vfs";
import { DEFAULT_SETTINGS, type Settings } from "./lib/settings";
import {
  clearSessionStore,
  defaultSession,
  loadSession,
  saveSession,
} from "./lib/session";
import { downloadBlob, vfsToZip } from "./lib/zip";
import { mountSandbox, prepareRun, type ConsoleLine } from "./lib/runner";
import { FileTree } from "./ui/FileTree";
import { EditorTabs } from "./ui/EditorTabs";
import { KebabMenu } from "./ui/KebabMenu";
import { SettingsDialog } from "./ui/SettingsDialog";
import { CreateDialog } from "./ui/CreateDialog";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { ConsolePanel } from "./ui/ConsolePanel";

export function App() {
  const loaded = useRef(loadSession());
  const [vfs, setVfs] = useState<Vfs>(loaded.current.session.vfs);
  const [openTabs, setOpenTabs] = useState<string[]>(loaded.current.session.openTabs);
  const [activeTab, setActiveTab] = useState<string | null>(loaded.current.session.activeTab);
  const [folder, setFolder] = useState("");
  const [settings, setSettings] = useState<Settings>(loaded.current.session.settings);
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createMode, setCreateMode] = useState<"file" | "folder" | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const skipAuto = useRef(loaded.current.restored);
  const nonce = useRef(0);
  const debounce = useRef<number>(0);
  const sandboxReady = useRef(false);
  const sandbox = useRef<ReturnType<typeof mountSandbox> | null>(null);

  const persist = useCallback(
    (next?: Partial<{ vfs: Vfs; openTabs: string[]; activeTab: string | null; settings: Settings }>) => {
      const session = {
        version: 1 as const,
        vfs: next?.vfs ?? vfs,
        openTabs: next?.openTabs ?? openTabs,
        activeTab: next?.activeTab ?? activeTab,
        settings: next?.settings ?? settings,
      };
      setSaveError(saveSession(session));
    },
    [vfs, openTabs, activeTab, settings],
  );

  useEffect(() => {
    persist();
  }, [vfs, openTabs, activeTab, settings, persist]);

  const execute = useCallback(
    (entry: string, files: Record<string, string>) => {
      const prepared = prepareRun(files, entry);
      if ("error" in prepared) {
        setRunError(prepared.error);
        setLines([{ kind: "error", text: prepared.error }]);
        return;
      }
      setRunError(null);
      nonce.current += 1;
      const n = nonce.current;
      setLines([]);
      sandbox.current?.destroy();
      sandboxReady.current = false;
      sandbox.current = mountSandbox(
        (line, lineNonce) => {
          if (lineNonce !== nonce.current) return;
          setLines((prev) => [...prev, line]);
        },
        () => {
          sandboxReady.current = true;
          sandbox.current?.run({ type: "run", nonce: n, entry, files: prepared.files });
        },
      );
    },
    [],
  );

  const runActive = useCallback(() => {
    if (!activeTab) return;
    skipAuto.current = false;
    execute(activeTab, vfs.files);
  }, [activeTab, vfs.files, execute]);

  useEffect(() => {
    if (!settings.autoRun || !activeTab || skipAuto.current) return;
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => execute(activeTab, vfs.files), 400);
    return () => window.clearTimeout(debounce.current);
  }, [vfs.files, activeTab, settings.autoRun, execute]);

  useEffect(() => () => sandbox.current?.destroy(), []);

  const openFile = (path: string) => {
    setActiveTab(path);
    setOpenTabs((tabs) => (tabs.includes(path) ? tabs : [...tabs, path]));
  };

  const closeTab = (path: string) => {
    const tabs = openTabs.filter((t) => t !== path);
    setOpenTabs(tabs);
    if (activeTab === path) setActiveTab(tabs[tabs.length - 1] ?? null);
  };

  const onCreateFile = (name: string, ext: FileExt) => {
    const next = addFile(vfs, folder, name, ext, "");
    if ("error" in next) return next.error;
    setVfs(next);
    openFile(`${folder ? folder + "/" : ""}${name}.${ext}`);
    skipAuto.current = false;
    return null;
  };

  const onCreateFolder = (name: string) => {
    const next = addFolder(vfs, folder, name);
    if ("error" in next) return next.error;
    setVfs(next);
    setFolder(folder ? `${folder}/${name}` : name);
    return null;
  };

  const themeClass = settings.theme === "light" ? "theme-light" : "theme-dark";
  const extensions = [
    javascript(),
    ...(settings.lineNumbers ? [lineNumbers()] : []),
    ...(settings.activeLine ? [highlightActiveLine()] : []),
    EditorView.theme({
      "&": { fontSize: `${settings.fontSize}px` },
      ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" },
    }),
    ...(settings.theme === "dark" ? [oneDark] : []),
    EditorView.lineWrapping,
  ];
  if (!settings.lineWrap) {
    extensions.splice(extensions.indexOf(EditorView.lineWrapping), 1);
  }

  const source = activeTab ? (vfs.files[activeTab] ?? "") : "";

  return (
    <div className={`app ${themeClass}`}>
      <header className="banner" role="banner">
        <KebabMenu
          onClear={() => setConfirmClear(true)}
          onDownload={async () => {
            const blob = await vfsToZip(vfs);
            downloadBlob(blob, "playground.zip");
          }}
        />
        <h1>JavaScript module playground</h1>
        <button type="button" className="primary" onClick={runActive} disabled={!activeTab}>
          Run
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="Open settings"
          onClick={() => setSettingsOpen(true)}
        >
          ⚙
        </button>
      </header>
      <div className="workspace">
        <nav className="sidebar" aria-label="Files">
          <div className="side-actions">
            <button type="button" onClick={() => setCreateMode("file")}>
              New file
            </button>
            <button type="button" onClick={() => setCreateMode("folder")}>
              New folder
            </button>
          </div>
          <FileTree
            vfs={vfs}
            selected={activeTab ?? folder}
            onSelectFile={openFile}
            onSelectFolder={setFolder}
          />
        </nav>
        <main className="main">
          <EditorTabs tabs={openTabs} active={activeTab} onSelect={setActiveTab} onClose={closeTab} />
          <div
            id="editor-panel"
            role="tabpanel"
            aria-labelledby={activeTab ? `tab-${activeTab}` : undefined}
            className="editor"
          >
            {activeTab ? (
              <CodeMirror
                value={source}
                height="100%"
                theme={settings.theme === "dark" ? "dark" : "light"}
                extensions={extensions}
                basicSetup={{ lineNumbers: settings.lineNumbers, highlightActiveLine: settings.activeLine }}
                onChange={(value) => {
                  skipAuto.current = false;
                  const next = writeFile(vfs, activeTab, value);
                  if ("error" in next) setRunError(next.error);
                  else setVfs(next);
                }}
                aria-label={`Code editor for ${activeTab}`}
              />
            ) : (
              <p className="hint">Open or create a .js / .mjs file.</p>
            )}
          </div>
        </main>
        <ConsolePanel lines={lines} />
      </div>
      {(saveError || runError) && (
        <div className="status" role="status">
          {runError || saveError}
        </div>
      )}
      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        onChange={setSettings}
        onClose={() => setSettingsOpen(false)}
      />
      <CreateDialog
        open={createMode !== null}
        mode={createMode ?? "file"}
        parentLabel={folder}
        onClose={() => setCreateMode(null)}
        onCreateFile={onCreateFile}
        onCreateFolder={onCreateFolder}
      />
      <ConfirmDialog
        open={confirmClear}
        title="Clear last session?"
        message="This removes saved files and settings from this browser and restores the starter project."
        confirmLabel="Clear session"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clearSessionStore();
          const fresh = defaultSession();
          setVfs(starterVfs());
          setOpenTabs(fresh.openTabs);
          setActiveTab(fresh.activeTab);
          setSettings({ ...DEFAULT_SETTINGS });
          setLines([]);
          skipAuto.current = true;
          setConfirmClear(false);
        }}
      />
    </div>
  );
}
