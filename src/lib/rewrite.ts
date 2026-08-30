import * as acorn from "acorn";

const VFS_ORIGIN = "https://vfs.local";

export type RewriteOk = { ok: true; code: string; imports: string[] };
export type RewriteErr = { ok: false; error: string };
export type RewriteResult = RewriteOk | RewriteErr;
export type ResolveOk = { ok: true; path: string };
export type ResolveErr = { ok: false; error: string };
export type ResolveResult = ResolveOk | ResolveErr;

function isStringLiteral(node: acorn.Node): node is acorn.Literal & { value: string } {
  return node.type === "Literal" && typeof (node as acorn.Literal).value === "string";
}

const SKIP_KEYS = new Set(["loc", "range", "start", "end"]);

function walk(node: acorn.Node, visit: (n: acorn.Node) => void): void {
  visit(node);
  for (const key of Object.keys(node)) {
    if (SKIP_KEYS.has(key)) continue;
    const value = (node as unknown as Record<string, unknown>)[key];
    if (!value || typeof value !== "object") continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === "object" && "type" in item) walk(item as acorn.Node, visit);
      }
    } else if ("type" in value) {
      walk(value as acorn.Node, visit);
    }
  }
}

export function resolveSpecifier(fromPath: string, spec: string): ResolveResult {
  if (spec.includes("%")) {
    try {
      spec = decodeURIComponent(spec);
    } catch {
      return { ok: false, error: `Invalid encoding in specifier: ${spec}` };
    }
  }
  if (!spec.startsWith("./") && !spec.startsWith("../")) {
    return { ok: false, error: `Only relative ./ or ../ imports are allowed (got ${spec})` };
  }
  if (/[?#\\]/.test(spec) || spec.includes("//")) {
    return { ok: false, error: `Invalid specifier: ${spec}` };
  }
  if (!/\.(js|mjs)$/.test(spec.split("/").pop() ?? "")) {
    return { ok: false, error: "Include the .js or .mjs extension (browsers do not add it)" };
  }
  const resolved = new URL(spec, `${VFS_ORIGIN}/${fromPath}`);
  if (resolved.origin !== VFS_ORIGIN) {
    return { ok: false, error: "Import path escaped the project" };
  }
  const path = resolved.pathname.replace(/^\//, "");
  if (!path || path.split("/").includes("..")) {
    return { ok: false, error: "Import path escaped the project" };
  }
  return { ok: true, path };
}

function hasImportAttributes(node: acorn.Node): boolean {
  const extra = node as acorn.Node & { attributes?: unknown[]; assertions?: unknown[] };
  return Boolean(extra.attributes?.length || extra.assertions?.length);
}

export function rewriteToVfs(fromPath: string, source: string, files: Set<string>): RewriteResult {
  let ast: acorn.Node;
  try {
    ast = acorn.parse(source, {
      ecmaVersion: "latest",
      sourceType: "module",
      allowAwaitOutsideFunction: true,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Parse error" };
  }

  const replacements: { start: number; end: number; text: string }[] = [];
  const imports: string[] = [];

  try {
    walk(ast, (node) => {
      if (
        node.type === "ImportDeclaration" ||
        node.type === "ExportNamedDeclaration" ||
        node.type === "ExportAllDeclaration"
      ) {
        const decl = node as acorn.ImportDeclaration | acorn.ExportNamedDeclaration | acorn.ExportAllDeclaration;
        if (hasImportAttributes(node)) {
          throw new Error("JSON/CSS import attributes are not allowed");
        }
        if (!decl.source) return;
        if (!isStringLiteral(decl.source)) {
          throw new Error("Import specifier must be a string literal");
        }
        const resolved = resolveSpecifier(fromPath, decl.source.value);
        if (!resolved.ok) throw new Error(resolved.error);
        if (!files.has(resolved.path)) throw new Error(`Module not found: ${resolved.path}`);
        imports.push(resolved.path);
        replacements.push({
          start: decl.source.start,
          end: decl.source.end,
          text: JSON.stringify(`vfs:///${resolved.path}`),
        });
      }
      if (node.type === "ImportExpression") {
        const expr = (node as acorn.ImportExpression).source;
        if (!isStringLiteral(expr)) {
          throw new Error("Dynamic import() is not allowed");
        }
        if (hasImportAttributes(node)) {
          throw new Error("JSON/CSS import attributes are not allowed");
        }
        const resolved = resolveSpecifier(fromPath, expr.value);
        if (!resolved.ok) throw new Error(resolved.error);
        if (!files.has(resolved.path)) throw new Error(`Module not found: ${resolved.path}`);
        imports.push(resolved.path);
        replacements.push({
          start: expr.start,
          end: expr.end,
          text: JSON.stringify(`vfs:///${resolved.path}`),
        });
      }
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Rewrite error" };
  }

  replacements.sort((a, b) => b.start - a.start);
  let code = source;
  for (const r of replacements) {
    code = code.slice(0, r.start) + r.text + code.slice(r.end);
  }
  return { ok: true, code, imports };
}

export function rewriteProject(
  files: Record<string, string>,
): { ok: true; files: Record<string, string> } | RewriteErr {
  const names = new Set(Object.keys(files));
  const out: Record<string, string> = {};
  for (const [path, source] of Object.entries(files)) {
    const result = rewriteToVfs(path, source, names);
    if (!result.ok) return { ok: false, error: `${path}: ${result.error}` };
    out[path] = result.code;
  }
  return { ok: true, files: out };
}
