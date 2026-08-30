import { describe, expect, it } from "vitest";
import { prepareRun } from "./runner";

describe("prepareRun", () => {
  it("treats an empty existing file as a valid entry", () => {
    const r = prepareRun({ "new.mjs": "" }, "new.mjs");
    expect("error" in r).toBe(false);
    if ("error" in r) return;
    expect(r.files["new.mjs"]).toBe("");
  });

  it("rejects a missing entry", () => {
    const r = prepareRun({}, "gone.mjs");
    expect("error" in r).toBe(true);
  });
});
