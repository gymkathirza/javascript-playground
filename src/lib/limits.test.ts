import { describe, expect, it } from "vitest";
import { MAX_FILE_CHARS, assertSafeSource, unicodeChars } from "./limits";

describe("limits", () => {
  it("allows tab newline carriage return", () => {
    expect(assertSafeSource("a\tb\nc\r\n")).toBeNull();
  });

  it("rejects NUL", () => {
    expect(assertSafeSource("ok\u0000no")).toBeTruthy();
  });

  it("counts a supplementary character as one character", () => {
    expect(unicodeChars("🙂")).toBe(1);
  });

  it("rejects more than MAX_FILE_CHARS", () => {
    expect(assertSafeSource("x".repeat(MAX_FILE_CHARS + 1))).toMatch(/characters/);
  });

  it("accepts MAX_FILE_CHARS ASCII characters", () => {
    expect(assertSafeSource("x".repeat(MAX_FILE_CHARS))).toBeNull();
  });
});

