import { describe, expect, it } from "vitest";
import { MAX_FILE_BYTES } from "./limits";
import { addFile, addFolder, renameStem, starterVfs, writeFile } from "./vfs";

describe("vfs", () => {
  it("creates js/mjs files and locks the extension on rename", () => {
    let vfs = starterVfs();
    const added = addFile(vfs, "", "util", "js");
    expect("error" in added).toBe(false);
    if ("error" in added) return;
    vfs = added;
    const renamed = renameStem(vfs, "util.js", "helpers");
    expect("error" in renamed).toBe(false);
    if ("error" in renamed) return;
    expect(renamed.files["helpers.js"]).toBeDefined();
    expect(renamed.files["util.js"]).toBeUndefined();
  });

  it("rejects a 6th folder level", () => {
    let vfs = starterVfs();
    for (const name of ["a", "b", "c", "d", "e"]) {
      const parent = ["a", "b", "c", "d", "e"].slice(0, ["a", "b", "c", "d", "e"].indexOf(name)).join("/");
      const next = addFolder(vfs, parent, name);
      expect("error" in next).toBe(false);
      if ("error" in next) return;
      vfs = next;
    }
    const sixth = addFolder(vfs, "a/b/c/d/e", "f");
    expect("error" in sixth).toBe(true);
  });

  it("rejects oversize files", () => {
    const vfs = starterVfs();
    const big = "x".repeat(MAX_FILE_BYTES + 1);
    const result = writeFile(vfs, "main.mjs", big);
    expect("error" in result).toBe(true);
  });
});
