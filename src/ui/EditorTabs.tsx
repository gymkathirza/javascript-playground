type Props = {
  tabs: string[];
  active: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
};

function basename(path: string): string {
  const i = path.lastIndexOf("/");
  return i === -1 ? path : path.slice(i + 1);
}

export function EditorTabs({ tabs, active, onSelect, onClose }: Props) {
  return (
    <div className="tablist" role="tablist" aria-label="Open files">
      {tabs.map((path) => {
        const selected = path === active;
        return (
          <div key={path} className={selected ? "tab selected" : "tab"}>
            <button
              type="button"
              role="tab"
              id={`tab-${path}`}
              aria-selected={selected}
              aria-controls="editor-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelect(path)}
              onKeyDown={(e) => {
                if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                e.preventDefault();
                const i = tabs.indexOf(path);
                const next = e.key === "ArrowRight" ? tabs[(i + 1) % tabs.length] : tabs[(i - 1 + tabs.length) % tabs.length];
                onSelect(next);
              }}
            >
              {basename(path)}
            </button>
            <button
              type="button"
              className="tab-close"
              aria-label={`Close ${basename(path)}`}
              onClick={() => onClose(path)}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
