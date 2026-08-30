import { describe, expect, it } from "vitest";
import { folderDepth, validateFilePath, validateSegment } from "./paths";

describe("paths", () => {
  it("counts folder depth from root = 0", () => {
    expect(folderDepth("")).toBe(0);
    expect(folderDepth("a/b/c/d/e")).toBe(5);
  });

  it("rejects slashes and dots in a create name", () => {
    expect(validateSegment("foo.js")).toBeTruthy();
    expect(validateSegment("a/b")).toBeTruthy();
    expect(validateSegment("math")).toBeNull();
  });

  it("allows a file at depth 5 and rejects depth 6", () => {
    expect(validateFilePath("a/b/c/d/e/file.mjs")).toBeNull();
    expect(validateFilePath("a/b/c/d/e/f/file.mjs")).toBeTruthy();
  });

  it("rejects path traversal", () => {
    expect(validateFilePath("../x.mjs")).toBeTruthy();
    expect(validateFilePath("a/../b.mjs")).toBeTruthy();
  });
});
