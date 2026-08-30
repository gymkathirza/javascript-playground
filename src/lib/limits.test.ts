import { describe, expect, it } from "vitest";
import { assertSafeSource } from "./limits";

describe("limits", () => {
  it("allows tab newline carriage return", () => {
    expect(assertSafeSource("a\tb\nc\r\n")).toBeNull();
  });

  it("rejects NUL", () => {
    expect(assertSafeSource("ok\u0000no")).toBeTruthy();
  });
});
