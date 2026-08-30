import { MAX_SESSION_CHARS } from "./limits";
import { starterVfs, type Vfs } from "./vfs";
import { DEFAULT_SETTINGS, type Settings } from "./settings";

export const SESSION_KEY = "jspg:session:v1";

export type Session = {
  version: 1;
  vfs: Vfs;
  openTabs: string[];
  activeTab: string | null;
  settings: Settings;
};

export function defaultSession(): Session {
  const vfs = starterVfs();
  return {
    version: 1,
    vfs,
    openTabs: ["main.mjs"],
    activeTab: "main.mjs",
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function serializeSession(session: Session): { json: string } | { error: string } {
  const json = JSON.stringify(session);
  if (json.length > MAX_SESSION_CHARS) {
    return { error: "Session is too large to save in this browser" };
  }
  return { json };
}

export function parseSession(raw: string): Session | null {
  try {
    const data = JSON.parse(raw) as Session;
    if (data.version !== 1 || !data.vfs?.files || !Array.isArray(data.vfs.folders)) return null;
    return {
      version: 1,
      vfs: data.vfs,
      openTabs: Array.isArray(data.openTabs) ? data.openTabs.filter((t) => t in data.vfs.files) : [],
      activeTab: data.activeTab && data.activeTab in data.vfs.files ? data.activeTab : null,
      settings: { ...DEFAULT_SETTINGS, ...data.settings },
    };
  } catch {
    return null;
  }
}

export function loadSession(): { session: Session; restored: boolean } {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return { session: defaultSession(), restored: false };
    const parsed = parseSession(raw);
    if (!parsed) return { session: defaultSession(), restored: false };
    return { session: parsed, restored: true };
  } catch {
    return { session: defaultSession(), restored: false };
  }
}

export function saveSession(session: Session): string | null {
  const packed = serializeSession(session);
  if ("error" in packed) return packed.error;
  try {
    localStorage.setItem(SESSION_KEY, packed.json);
    return null;
  } catch {
    return "Could not save session (private mode or quota)";
  }
}

export function clearSessionStore(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
