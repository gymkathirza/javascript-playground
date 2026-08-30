export const MAX_FILE_BYTES = 1024 * 1024;
/** UTF-8 is at most 4 bytes per Unicode character, so this many chars cannot exceed 1 MiB. */
export const MAX_FILE_CHARS = Math.floor(MAX_FILE_BYTES / 4);
export const MAX_FILES = 32;
export const MAX_SESSION_CHARS = 1_500_000;
export const MAX_FOLDER_DEPTH = 5;

const ALLOWED_C0 = new Set([0x09, 0x0a, 0x0d]);

export function unicodeChars(text: string): number {
  let n = 0;
  for (const _ of text) n += 1;
  return n;
}

export function utf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function assertSafeSource(text: string): string | null {
  if (unicodeChars(text) > MAX_FILE_CHARS) {
    return `File exceeds ${MAX_FILE_CHARS} characters`;
  }
  if (utf8Bytes(text) > MAX_FILE_BYTES) {
    return `File exceeds ${MAX_FILE_BYTES} bytes`;
  }
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 0x20 && !ALLOWED_C0.has(code)) {
      return "Control characters are not allowed";
    }
    if (code === 0xfeff && i !== 0) {
      return "Unexpected BOM character";
    }
  }
  return null;
}
