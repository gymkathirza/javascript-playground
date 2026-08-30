import { useMemo, useState, type KeyboardEvent } from "react";
import { childrenOf, type Vfs } from "../lib/vfs";
import { parentDir } from "../lib/paths";

type Props = {
  vfs: Vfs;
  selected: string | null;
  onSelectFile: (path: string) => void;
  onSelectFolder: (path: string) => void;
};

function basename(path: string): string {
  const i = path.lastIndexOf("/");
  return i === -1 ? path : path.slice(i + 1);
}

export function FileTree({ vfs, selected, onSelectFile, onSelectFolder }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ lib: true });
  const [focus, setFocus] = useState<string>("");

  const items = useMemo(() => {
    const out: { id: string; kind: "file" | "folder"; level: number }[] = [];
    const walk = (parent: string, level: number) => {
      const { folders, files } = childrenOf(vfs, parent);
      for (const f of folders) {
        out.push({ id: f, kind: "folder", level });
        if (expanded[f] !== false) walk(f, level + 1);
      }
      for (const f of files) out.push({ id: f, kind: "file", level });
    };
    walk("", 1);
    return out;
  }, [vfs, expanded]);

  const onKey = (e: KeyboardEvent) => {
    const idx = items.findIndex((i) => i.id === focus);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = items[Math.min(items.length - 1, idx + 1)];
      if (next) setFocus(next.id);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = items[Math.max(0, idx - 1)];
      if (prev) setFocus(prev.id);
    } else if (e.key === "Home") {
      e.preventDefault();
      if (items[0]) setFocus(items[0].id);
    } else if (e.key === "End") {
      e.preventDefault();
      const last = items[items.length - 1];
      if (last) setFocus(last.id);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const cur = items.find((i) => i.id === focus);
      if (!cur) return;
      if (cur.kind === "file") onSelectFile(cur.id);
      else {
        setExpanded((m) => ({ ...m, [cur.id]: m[cur.id] === false }));
        onSelectFolder(cur.id);
      }
    } else if (e.key === "ArrowRight") {
      const cur = items.find((i) => i.id === focus);
      if (cur?.kind === "folder" && expanded[cur.id] === false) {
        setExpanded((m) => ({ ...m, [cur.id]: true }));
      }
    } else if (e.key === "ArrowLeft") {
      const cur = items.find((i) => i.id === focus);
      if (cur?.kind === "folder" && expanded[cur.id] !== false) {
        setExpanded((m) => ({ ...m, [cur.id]: false }));
      } else if (cur) {
        const p = parentDir(cur.id);
        if (p) setFocus(p);
      }
    }
  };

  return (
    <ul role="tree" aria-label="Project files" className="tree" onKeyDown={onKey}>
      {items.map((item) => {
        const isFolder = item.kind === "folder";
        const isExpanded = isFolder ? expanded[item.id] !== false : undefined;
        const isSelected = selected === item.id;
        const tabIndex = (focus || items[0]?.id) === item.id ? 0 : -1;
        return (
          <li
            key={item.id}
            role="treeitem"
            aria-expanded={isFolder ? isExpanded : undefined}
            aria-selected={isSelected}
            tabIndex={tabIndex}
            aria-level={item.level}
            className={isSelected ? "selected" : ""}
            style={{ paddingLeft: item.level * 12 }}
            onClick={() => {
              setFocus(item.id);
              if (isFolder) {
                setExpanded((m) => ({ ...m, [item.id]: m[item.id] === false }));
                onSelectFolder(item.id);
              } else onSelectFile(item.id);
            }}
            onFocus={() => setFocus(item.id)}
          >
            {isFolder ? (isExpanded ? "▾ " : "▸ ") : ""}
            {basename(item.id)}
          </li>
        );
      })}
    </ul>
  );
}
