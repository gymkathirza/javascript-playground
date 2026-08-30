import { describe, expect, it } from "vitest";
import { resolveSpecifier, rewriteProject, rewriteReachable, rewriteToVfs } from "./rewrite";

describe("resolveSpecifier", () => {
  it("resolves a sibling", () => {
    const r = resolveSpecifier("lib/math.mjs", "./add.mjs");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.path).toBe("lib/add.mjs");
  });

  it("rejects missing extension", () => {
    expect(resolveSpecifier("main.mjs", "./lib/math").ok).toBe(false);
  });

  it("rejects bare and remote specifiers", () => {
    expect(resolveSpecifier("main.mjs", "lodash").ok).toBe(false);
    expect(resolveSpecifier("main.mjs", "https://example.com/x.mjs").ok).toBe(false);
    expect(resolveSpecifier("main.mjs", "//cdn/x.mjs").ok).toBe(false);
  });

  it("rejects %2e%2e tricks after decode", () => {
    const encoded = resolveSpecifier("lib/a.mjs", "./%2e%2e/secret.mjs");
    expect(encoded.ok).toBe(true);
    if (encoded.ok) expect(encoded.path).toBe("secret.mjs");
  });
});

describe("rewriteToVfs", () => {
  const files = new Set(["main.mjs", "lib/math.mjs", "lib/extra.mjs"]);

  it("rewrites import and export-from", () => {
    const src = `import { add } from './lib/math.mjs';\nexport { add as plus } from './lib/math.mjs';\nexport * from './lib/extra.mjs';\n`;
    const r = rewriteToVfs("main.mjs", src, files);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.code).toContain('"vfs:///lib/math.mjs"');
      expect(r.code).toContain('"vfs:///lib/extra.mjs"');
    }
  });

  it("rewrites static import()", () => {
    const r = rewriteToVfs("main.mjs", `const m = import('./lib/math.mjs');\n`, files);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.code).toContain('"vfs:///lib/math.mjs"');
  });

  it("rejects import(expr)", () => {
    const r = rewriteToVfs("main.mjs", `const p = './lib/math.mjs'; import(p);\n`, files);
    expect(r.ok).toBe(false);
  });

  it("is case-sensitive", () => {
    const r = rewriteToVfs("main.mjs", `import { add } from './lib/Math.mjs';\n`, files);
    expect(r.ok).toBe(false);
  });
});

describe("rewriteProject", () => {
  it("rewrites a two-file graph", () => {
    const r = rewriteProject({
      "lib/math.mjs": `export function add(a, b) { return a + b; }\n`,
      "main.mjs": `import { add } from './lib/math.mjs';\nconsole.log(add(2, 3));\n`,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.files["main.mjs"]).toContain("vfs:///lib/math.mjs");
  });
});

describe("rewriteReachable", () => {
  it("ignores an unused broken sibling", () => {
    const r = rewriteReachable("main.mjs", {
      "main.mjs": `import { add } from './lib/math.mjs';\n`,
      "lib/math.mjs": `export function add(a, b) { return a + b; }\n`,
      "scratch.mjs": `const x =`,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.files["scratch.mjs"]).toBeUndefined();
  });

  it("accepts an empty entry module", () => {
    const r = rewriteReachable("empty.mjs", { "empty.mjs": "" });
    expect(r.ok).toBe(true);
  });
});
