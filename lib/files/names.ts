import type { SupportedMime } from "./types";
const extensions: Record<SupportedMime, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export function compressedName(name: string, mime: SupportedMime, taken = new Set<string>()): string {
  const stem = name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9._-]+/gi, "-") || "image";
  let candidate = `${stem}-compressed.${extensions[mime]}`; let index = 2;
  while (taken.has(candidate)) candidate = `${stem}-compressed-${index++}.${extensions[mime]}`;
  return candidate;
}
