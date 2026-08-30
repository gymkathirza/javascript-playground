import { useRef } from "react";
import type { Settings, Theme } from "../lib/settings";
import { useFocusTrap } from "./useFocusTrap";

type Props = {
  open: boolean;
  settings: Settings;
  onChange: (next: Settings) => void;
  onClose: () => void;
};

export function SettingsDialog({ open, settings, onChange, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(open, ref, onClose);
  if (!open) return null;

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    onChange({ ...settings, [key]: value });

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="modal-head">
          <h2 id="settings-title">Customize</h2>
          <button type="button" className="icon-btn" aria-label="Close settings" onClick={onClose}>
            ×
          </button>
        </header>
        <section aria-labelledby="general-h">
          <h3 id="general-h">General</h3>
          <label className="row-field">
            <span>Auto-Run</span>
            <input
              type="checkbox"
              checked={settings.autoRun}
              onChange={(e) => set("autoRun", e.target.checked)}
            />
          </label>
          <label className="row-field">
            <span>Show Undefined</span>
            <input
              type="checkbox"
              checked={settings.showUndefined}
              onChange={(e) => set("showUndefined", e.target.checked)}
              aria-describedby="undef-hint"
            />
          </label>
          <p id="undef-hint" className="hint">
            Modules have no completion value. This setting does not change output.
          </p>
          <label className="row-field">
            <span>Line Wrap</span>
            <input
              type="checkbox"
              checked={settings.lineWrap}
              onChange={(e) => set("lineWrap", e.target.checked)}
            />
          </label>
        </section>
        <section aria-labelledby="appear-h">
          <h3 id="appear-h">Appearance</h3>
          <label className="row-field">
            <span>Font Size</span>
            <input
              type="number"
              min={10}
              max={28}
              value={settings.fontSize}
              onChange={(e) => set("fontSize", Number(e.target.value) || 16)}
            />
          </label>
          <label className="row-field">
            <span>Theme</span>
            <select
              value={settings.theme}
              onChange={(e) => set("theme", e.target.value as Theme)}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </label>
          <label className="row-field">
            <span>Line Numbers</span>
            <input
              type="checkbox"
              checked={settings.lineNumbers}
              onChange={(e) => set("lineNumbers", e.target.checked)}
            />
          </label>
          <label className="row-field">
            <span>Active Line</span>
            <input
              type="checkbox"
              checked={settings.activeLine}
              onChange={(e) => set("activeLine", e.target.checked)}
            />
          </label>
        </section>
      </div>
    </div>
  );
}
