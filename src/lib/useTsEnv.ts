import { useEffect, useRef, useState } from "react";
import {
  createDefaultMapFromCDN,
  createSystem,
  createVirtualTypeScriptEnvironment,
  type VirtualTypeScriptEnvironment,
} from "@typescript/vfs";
import ts from "typescript";

function vfsPath(path: string): string {
  return `/${path}`;
}

export function useTsEnv(files: Record<string, string>): VirtualTypeScriptEnvironment | null {
  const [env, setEnv] = useState<VirtualTypeScriptEnvironment | null>(null);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;
    const compilerOpts: ts.CompilerOptions = {
      allowJs: true,
      checkJs: true,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      lib: ["es2022", "dom"],
    };
    void (async () => {
      let fsMap: Map<string, string>;
      try {
        fsMap = await createDefaultMapFromCDN(compilerOpts, ts.version, true, ts);
      } catch {
        fsMap = new Map();
      }
      if (cancelled) return;
      const created = createVirtualTypeScriptEnvironment(createSystem(fsMap), [], ts, compilerOpts);
      setEnv(created);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!env) return;
    const next = new Set(Object.keys(files).map(vfsPath));
    for (const path of seen.current) {
      if (!next.has(path)) env.deleteFile(path);
    }
    for (const [path, code] of Object.entries(files)) {
      const full = vfsPath(path);
      if (env.getSourceFile(full)) env.updateFile(full, code);
      else env.createFile(full, code);
    }
    seen.current = next;
  }, [env, files]);

  return env;
}
