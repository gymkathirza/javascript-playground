import { describe, expect, it } from "vitest";
import { defaultSession, parseSession, serializeSession } from "./session";

describe("session", () => {
  it("round-trips a session", () => {
    const s = defaultSession();
    const packed = serializeSession(s);
    expect("json" in packed).toBe(true);
    if (!("json" in packed)) return;
    const parsed = parseSession(packed.json);
    expect(parsed?.activeTab).toBe("main.mjs");
    expect(parsed?.vfs.files["lib/math.mjs"]).toContain("export function add");
  });

  it("drops missing tabs", () => {
    const parsed = parseSession(
      JSON.stringify({
        version: 1,
        vfs: { files: { "a.mjs": "" }, folders: [] },
        openTabs: ["gone.mjs", "a.mjs"],
        activeTab: "gone.mjs",
        settings: {},
      }),
    );
    expect(parsed?.openTabs).toEqual(["a.mjs"]);
    expect(parsed?.activeTab).toBeNull();
  });
});
