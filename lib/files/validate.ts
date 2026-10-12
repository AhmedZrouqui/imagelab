import { MAX_BATCH_BYTES, MAX_FILE_BYTES, MAX_PIXELS } from "@/lib/constants";
import { detectImageType } from "./signatures";
import type { ValidationResult } from "./types";

async function dimensions(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const result = { width: bitmap.width, height: bitmap.height }; bitmap.close(); return result;
}

export async function validateFile(file: File, currentBatchBytes = 0): Promise<ValidationResult> {
  if (file.size > MAX_FILE_BYTES) return { ok: false, code: "file-too-large", message: "This image is larger than the 30 MB limit." };
  if (currentBatchBytes + file.size > MAX_BATCH_BYTES) return { ok: false, code: "batch-too-large", message: "This selection exceeds the 250 MB batch limit." };
  const mime = detectImageType(new Uint8Array(await file.slice(0, 16).arrayBuffer()));
  if (!mime) return { ok: false, code: file.type.startsWith("image/") ? "invalid-signature" : "unsupported-type", message: "Use a valid JPG, PNG, or WebP image." };
  if (file.type && file.type !== mime && !(file.type === "image/jpg" && mime === "image/jpeg")) return { ok: false, code: "invalid-signature", message: "The file contents do not match its declared format." };
  try {
    const size = await dimensions(file);
    if (size.width * size.height > MAX_PIXELS) return { ok: false, code: "dimensions-too-large", message: "This image exceeds the 40 megapixel safety limit." };
    return { ok: true, mime, ...size };
  } catch { return { ok: false, code: "decode-failed", message: "This image is damaged or cannot be decoded." }; }
}
