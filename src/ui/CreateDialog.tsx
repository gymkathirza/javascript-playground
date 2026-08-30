import { useRef, useState } from "react";
import type { FileExt } from "../lib/vfs";
import { useFocusTrap } from "./useFocusTrap";

type Mode = "file" | "folder";

type Props = {
  open: boolean;
  mode: Mode;
  parentLabel: string;
  onClose: () => void;
  onCreateFile: (name: string, ext: FileExt) => string | null;
  onCreateFolder: (name: string) => string | null;
};

export function CreateDialog({
  open,
  mode,
  parentLabel,
  onClose,
  onCreateFile,
  onCreateFolder,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [ext, setExt] = useState<FileExt>("mjs");
  const [error, setError] = useState<string | null>(null);
  useFocusTrap(open, ref, onClose);
  if (!open) return null;

  const submit = () => {
    const err = mode === "file" ? onCreateFile(name.trim(), ext) : onCreateFolder(name.trim());
    if (err) {
      setError(err);
      return;
    }
    setName("");
    setError(null);
    onClose();
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-title"
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="modal-head">
          <h2 id="create-title">{mode === "file" ? "New file" : "New folder"}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>
        <p className="hint">In {parentLabel || "project root"}. Name only — no extension or slashes.</p>
        <label className="stack-field">
          <span>Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        {mode === "file" && (
          <fieldset className="ext-set">
            <legend>File type</legend>
            <label>
              <input type="radio" name="ext" checked={ext === "mjs"} onChange={() => setExt("mjs")} />
              .mjs (ES module)
            </label>
            <label>
              <input type="radio" name="ext" checked={ext === "js"} onChange={() => setExt("js")} />
              .js
            </label>
          </fieldset>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary" onClick={submit}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
