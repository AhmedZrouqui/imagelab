import type { CompressionResult, Encoder, ImageSource, OutputChoice } from "./types";
import type { SupportedMime } from "@/lib/files/types";

const qualities = [0.9, 0.82, 0.74, 0.66, 0.56, 0.46, 0.36, 0.26, 0.16, 0.08];
const scales = [1, 0.88, 0.76, 0.64, 0.52, 0.4, 0.3, 0.22, 0.16];
const cancelled = (): CompressionResult => ({ status: "limited", reason: "cancelled", message: "Compression was cancelled." });

export async function compressAutomatic(source: ImageSource, encode: Encoder, signal?: AbortSignal): Promise<CompressionResult> {
  if (signal?.aborted) return cancelled();
  try {
    const blob = await encode({ source, quality: source.mime === "image/png" ? 1 : 0.82, scale: 1, mime: source.mime });
    if (blob.size >= source.file.size * 0.98) return { status: "limited", reason: "already-optimized", message: "This image is already well optimized.", best: source.file };
    return { status: "success", blob, width: source.width, height: source.height, mime: source.mime, attempts: 1 };
  } catch { return { status: "limited", reason: "processing-failed", message: "The browser could not compress this image." }; }
}

export async function compressToTarget(source: ImageSource, targetBytes: number, output: OutputChoice, encode: Encoder, signal?: AbortSignal): Promise<CompressionResult> {
  if (signal?.aborted) return cancelled();
  const mime: SupportedMime = output === "preserve" ? source.mime : output;
  let attempts = 0; let best: Blob | undefined; let bestScale = 1;
  try {
    for (const scale of scales) {
      const qs = mime === "image/png" ? [1] : qualities;
      for (const quality of qs) {
        if (signal?.aborted) return cancelled();
        const blob = await encode({ source, quality, scale, mime }); attempts++;
        if (blob.size <= targetBytes * 0.98 && (!best || scale > bestScale || (scale === bestScale && blob.size > best.size))) { best = blob; bestScale = scale; }
      }
      if (best) break;
    }
    if (!best) return { status: "limited", reason: "unreachable-target", message: source.hasAlpha && mime === "image/png" ? "Preserving PNG transparency prevents this target. Try WebP if transparency may be re-encoded." : "This target cannot be reached without excessive degradation." };
    return { status: "success", blob: best, width: Math.max(1, Math.round(source.width * bestScale)), height: Math.max(1, Math.round(source.height * bestScale)), mime, attempts };
  } catch { return { status: "limited", reason: "processing-failed", message: "The browser could not compress this image." }; }
}
