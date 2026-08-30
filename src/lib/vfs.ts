import { MAX_FILES, assertSafeSource } from "./limits";
import { folderDepth, joinPosix, parentDir, validateFilePath, validateSegment } from "./paths";

export type FileExt = "js" | "mjs";

export type Vfs = {
  files: Record<string, string>;
  folders: string[];
};

export const STARTER_MAIN = `import { add } from './lib/math.mjs';

console.log('2 + 3 =', add(2, 3));
`;

export const STARTER_MATH = `export function add(a, b) {
  return a + b;
}
`;

export function emptyVfs(): Vfs {
  return { files: {}, folders: [] };
}

export function starterVfs(): Vfs {
  return {
    folders: ["lib"],
    files: {
      "main.mjs": STARTER_MAIN,
      "lib/math.mjs": STARTER_MATH,
    },
  };
}

export function listFolders(vfs: Vfs): string[] {
  return [...vfs.folders].sort();
}

export function fileCount(vfs: Vfs): number {
  return Object.keys(vfs.files).length;
}

export function addFolder(vfs: Vfs, parent: string, name: string): Vfs | { error: string } {
  const err = validateSegment(name);
  if (err) return { error: err };
  const path = joinPosix(parent, name);
  if (folderDepth(path) > 5) return { error: "Folder depth cannot exceed 5" };
  if (vfs.folders.includes(path) || vfs.files[path]) return { error: "Already exists" };
  if (parent && !vfs.folders.includes(parent)) return { error: "Parent folder missing" };
  return { ...vfs, folders: [...vfs.folders, path] };
}

export function addFile(
  vfs: Vfs,
  parent: string,
  name: string,
  ext: FileExt,
  content = "",
): Vfs | { error: string } {
  const err = validateSegment(name);
  if (err) return { error: err };
  if (fileCount(vfs) >= MAX_FILES) return { error: `At most ${MAX_FILES} files` };
  const path = joinPosix(parent, `${name}.${ext}`);
  const pathErr = validateFilePath(path);
  if (pathErr) return { error: pathErr };
  if (vfs.files[path] !== undefined) return { error: "File already exists" };
  if (parent && !vfs.folders.includes(parent)) return { error: "Parent folder missing" };
  const srcErr = assertSafeSource(content);
  if (srcErr) return { error: srcErr };
  return { ...vfs, files: { ...vfs.files, [path]: content } };
}

export function writeFile(vfs: Vfs, path: string, content: string): Vfs | { error: string } {
  if (vfs.files[path] === undefined) return { error: "File not found" };
  const srcErr = assertSafeSource(content);
  if (srcErr) return { error: srcErr };
  return { ...vfs, files: { ...vfs.files, [path]: content } };
}

export function renameStem(vfs: Vfs, path: string, newStem: string): Vfs | { error: string } {
  const err = validateSegment(newStem);
  if (err) return { error: err };
  const content = vfs.files[path];
  if (content === undefined) return { error: "File not found" };
  const ext = path.endsWith(".mjs") ? "mjs" : "js";
  const next = joinPosix(parentDir(path), `${newStem}.${ext}`);
  if (next !== path && vfs.files[next] !== undefined) return { error: "File already exists" };
  const files = { ...vfs.files };
  delete files[path];
  files[next] = content;
  return { ...vfs, files };
}

export function removeFile(vfs: Vfs, path: string): Vfs {
  const files = { ...vfs.files };
  delete files[path];
  return { ...vfs, files };
}

export function removeFolder(vfs: Vfs, folder: string): Vfs {
  const prefix = folder + "/";
  const folders = vfs.folders.filter((f) => f !== folder && !f.startsWith(prefix));
  const files = Object.fromEntries(
    Object.entries(vfs.files).filter(([p]) => !p.startsWith(prefix) && p !== folder),
  );
  return { files, folders };
}

export function childrenOf(vfs: Vfs, parent: string): { folders: string[]; files: string[] } {
  const folders = vfs.folders
    .filter((f) => parentDir(f) === parent)
    .sort((a, b) => a.localeCompare(b));
  const files = Object.keys(vfs.files)
    .filter((f) => parentDir(f) === parent)
    .sort((a, b) => a.localeCompare(b));
  return { folders, files };
}
