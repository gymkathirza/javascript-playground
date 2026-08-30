import { useEffect, useId, useRef, useState } from "react";

type Props = {
  onClear: () => void;
  onDownload: () => void;
};

export function KebabMenu({ onClear, onDownload }: Props) {
  const [open, setOpen] = useState(false);
  const btnId = useId();
  const menuId = useId();
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="kebab" ref={wrap}>
      <button
        type="button"
        id={btnId}
        className="icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Project menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">⋮</span>
      </button>
      {open && (
        <ul id={menuId} role="menu" aria-labelledby={btnId} className="menu">
          <li role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onDownload();
              }}
            >
              Download all files (zip)
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onClear();
              }}
            >
              Clear last session
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
