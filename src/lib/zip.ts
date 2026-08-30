import JSZip from "jszip";
import type { Vfs } from "./vfs";

export async function vfsToZip(vfs: Vfs): Promise<Blob> {
  const zip = new JSZip();
  for (const folder of vfs.folders) {
    zip.folder(folder);
  }
  for (const [path, content] of Object.entries(vfs.files)) {
    if (path.includes("..") || path.startsWith("/") || path.includes("\\")) {
      throw new Error("Refusing to zip an unsafe path");
    }
    zip.file(path, content);
  }
  return zip.generateAsync({ type: "blob" });
}

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(url);
}
