import { browserEncoder } from "./browser-codec";
import { compressAutomatic, compressToTarget } from "./engine";
import type { CompressionResult, ImageSource, OutputChoice } from "./types";

type Options = { mode: "auto" | "target"; targetBytes?: number; output?: OutputChoice };

export async function runCompression(source: ImageSource, options: Options): Promise<CompressionResult> {
  if (typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined") {
    try {
      return await new Promise<CompressionResult>((resolve, reject) => {
        const worker = new Worker(new URL("../../workers/compression.worker.ts", import.meta.url), { type: "module" });
        const id = crypto.randomUUID();
        const timeout = setTimeout(() => { worker.terminate(); reject(new Error("Worker timed out")); }, 30_000);
        worker.onmessage = (event: MessageEvent<{ id: string; result?: CompressionResult; error?: string }>) => {
          if (event.data.id !== id) return;
          clearTimeout(timeout); worker.terminate();
          if (event.data.result) resolve(event.data.result); else reject(new Error(event.data.error));
        };
        worker.onerror = () => { clearTimeout(timeout); worker.terminate(); reject(new Error("Worker unavailable")); };
        worker.postMessage({ id, source, ...options });
      });
    } catch { /* Use the main-thread codec once when workers are unavailable. */ }
  }
  return options.mode === "auto" ? compressAutomatic(source, browserEncoder) : compressToTarget(source, options.targetBytes ?? 100_000, options.output ?? "preserve", browserEncoder);
}
