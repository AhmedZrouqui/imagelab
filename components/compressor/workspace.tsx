"use client";
/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";
import { Download, ImagePlus, RotateCcw, Trash2, X } from "lucide-react";
import { useCompressionStore } from "@/hooks/use-compression-store";
import {
  compressionStore,
  type CompressionItem,
} from "@/stores/compression-store";
import { runCompression } from "@/lib/compression/runner";
import type { OutputChoice } from "@/lib/compression/types";
import { runWithConcurrency } from "@/lib/compression/scheduler";
import { createResultsZip } from "@/lib/compression/zip";
import { compressedName } from "@/lib/files/names";
import { downloadBlob } from "@/lib/files/download";
import { formatBytes } from "@/lib/files/format";
import { UploadDropzone } from "@/components/upload-dropzone";

const presets = [20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000];
export function CompressorWorkspace() {
  const state = useCompressionStore();
  const [mode, setMode] = useState<"auto" | "target">(
    state.initialTargetBytes ? "target" : "auto",
  );
  const [target, setTarget] = useState(state.initialTargetBytes || 100_000);
  const [unit, setUnit] = useState<"KB" | "MB">("KB");
  const [output, setOutput] = useState<OutputChoice>("preserve");
  const [preview, setPreview] = useState<"original" | "compressed">("original");
  const [announcement, setAnnouncement] = useState("");
  const selected = useMemo(
    () => state.items.find((i) => i.id === state.selectedId) || state.items[0],
    [state],
  );
  const processing = state.items.some((i) => i.status === "processing");
  async function compress(item: CompressionItem) {
    if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
    compressionStore.update(item.id, {
      status: "processing",
      error: undefined,
      result: undefined,
      resultUrl: undefined,
    });
    const source = {
      file: item.file,
      width: item.width,
      height: item.height,
      mime: item.mime,
      hasAlpha: item.hasAlpha,
    };
    const result = await runCompression(
      source,
      mode === "auto"
        ? { mode: "auto" }
        : { mode: "target", targetBytes: target, output },
    );
    if (result.status === "success") {
      const resultUrl = URL.createObjectURL(result.blob);
      compressionStore.update(item.id, {
        status: "completed",
        result,
        resultUrl,
      });
      setPreview("compressed");
      setAnnouncement(`${item.file.name} completed.`);
    } else {
      compressionStore.update(item.id, {
        status: result.reason === "cancelled" ? "cancelled" : "failed",
        result,
        error: result.message,
      });
      setAnnouncement(`${item.file.name}: ${result.message}`);
    }
  }
  async function compressAll() {
    await runWithConcurrency(compressionStore.getSnapshot().items, compress, 2);
  }
  function individual(item: CompressionItem) {
    if (item.result?.status !== "success") return;
    downloadBlob(
      item.result.blob,
      compressedName(item.file.name, item.result.mime),
    );
  }
  async function zipAll() {
    const taken = new Set<string>();
    const files = state.items.flatMap((item) => {
      if (item.result?.status !== "success") return [];
      const name = compressedName(item.file.name, item.result.mime, taken);
      taken.add(name);
      return [{ name, blob: item.result.blob }];
    });
    downloadBlob(await createResultsZip(files), "imagelab-compressed.zip");
  }
  if (!state.items.length)
    return (
      <main id="main" className="shell py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold">
            Select images to start compressing
          </h1>
          <p className="mt-3 mb-8 text-zinc-400">
            Your previous session was not stored. Choose the original images
            again.
          </p>
          <UploadDropzone />
        </div>
      </main>
    );
  return (
    <main id="main" className="shell py-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">Local workspace</p>
          <h1 className="mt-1 text-2xl font-semibold">Compress images</h1>
        </div>
        <div className="flex gap-2">
          <label className="button button-secondary cursor-pointer">
            <ImagePlus size={16} />
            Add images
            <input
              className="sr-only"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={async (e) => {
                if (!e.target.files) return;
                const { validateFile } = await import("@/lib/files/validate");
                for (const file of Array.from(e.target.files)) {
                  const result = await validateFile(file);
                  if (result.ok)
                    compressionStore.addValidated(file, {
                      ...result,
                      hasAlpha: result.mime === "image/png",
                    });
                }
              }}
            />
          </label>
          <button
            className="button button-secondary"
            onClick={() => {
              if (confirm("Discard this entire batch?"))
                compressionStore.reset();
            }}
          >
            <RotateCcw size={16} />
            Start over
          </button>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="rounded-xl border border-zinc-800 bg-[#111113] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium">Images</h2>
              <span className="mono text-xs text-zinc-600">
                {state.items.length}/40
              </span>
            </div>
            <div className="max-h-72 space-y-1 overflow-auto">
              {state.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => compressionStore.select(item.id)}
                  className={`group flex w-full items-center gap-3 rounded-lg border p-2 text-left ${selected?.id === item.id ? "border-zinc-600 bg-zinc-800/70" : "border-transparent hover:bg-zinc-900"}`}
                >
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="size-10 rounded-md object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">
                      {item.file.name}
                    </span>
                    <span className="mono block text-[11px] text-zinc-500">
                      {formatBytes(item.file.size)} · {item.status}
                    </span>
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Remove ${item.file.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      compressionStore.remove(item.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") compressionStore.remove(item.id);
                    }}
                    className="rounded p-1 text-zinc-600 hover:text-white"
                  >
                    <X size={15} />
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className="rounded-xl border border-zinc-800 bg-[#111113] p-4">
            <h2 className="text-sm font-medium">Compression</h2>
            <label
              className={`mt-4 block cursor-pointer rounded-lg border p-3 ${mode === "auto" ? "border-zinc-500 bg-zinc-900" : "border-zinc-800"}`}
            >
              <input
                type="radio"
                name="mode"
                checked={mode === "auto"}
                onChange={() => setMode("auto")}
                className="mr-2"
              />
              <span className="text-sm font-medium">
                Auto — Balanced quality
              </span>
              <span className="mt-1 block pl-6 text-xs leading-5 text-zinc-500">
                Reduce size while keeping the image looking great.
              </span>
            </label>
            <label
              className={`mt-2 block cursor-pointer rounded-lg border p-3 ${mode === "target" ? "border-zinc-500 bg-zinc-900" : "border-zinc-800"}`}
            >
              <input
                type="radio"
                name="mode"
                checked={mode === "target"}
                onChange={() => setMode("target")}
                className="mr-2"
              />
              <span className="text-sm font-medium">
                Compress to a specific size
              </span>
            </label>
            {mode === "target" && (
              <div className="mt-3">
                <div className="flex">
                  <input
                    aria-label="Target size"
                    type="number"
                    min="1"
                    value={
                      unit === "KB"
                        ? Math.round(target / 1000)
                        : target / 1_000_000
                    }
                    onChange={(e) =>
                      setTarget(
                        Math.max(1, Number(e.target.value)) *
                          (unit === "KB" ? 1000 : 1_000_000),
                      )
                    }
                    className="min-w-0 flex-1 rounded-l-lg border border-zinc-700 bg-zinc-950 px-3 py-2 mono"
                  />
                  <select
                    aria-label="Target unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as "KB" | "MB")}
                    className="rounded-r-lg border border-l-0 border-zinc-700 bg-zinc-900 px-3"
                  >
                    <option>KB</option>
                    <option>MB</option>
                  </select>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {presets.map((value) => (
                    <button
                      key={value}
                      onClick={() => {
                        setTarget(value);
                        setUnit(value >= 1_000_000 ? "MB" : "KB");
                      }}
                      className="rounded border border-zinc-800 px-2 py-1 text-xs text-zinc-500 hover:text-white"
                    >
                      {formatBytes(value)}
                    </button>
                  ))}
                </div>
                <label className="mt-3 block text-xs text-zinc-500">
                  Output format
                  <select
                    aria-label="Output format"
                    value={output}
                    onChange={(event) =>
                      setOutput(event.target.value as OutputChoice)
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200"
                  >
                    <option value="preserve">Keep original format</option>
                    <option value="image/webp">WebP</option>
                    <option value="image/jpeg">
                      JPEG (removes transparency)
                    </option>
                  </select>
                </label>
                {selected?.hasAlpha && output === "image/jpeg" && (
                  <p className="mt-2 text-xs leading-5 text-amber-300">
                    JPEG cannot preserve transparent pixels. They will be
                    flattened against black when you choose this format.
                  </p>
                )}
              </div>
            )}
            <button
              disabled={processing}
              onClick={() => selected && void compress(selected)}
              className="button button-primary mt-5 w-full"
            >
              Compress image
            </button>
            <button
              disabled={processing || state.items.length < 2}
              onClick={() => void compressAll()}
              className="button button-secondary mt-2 w-full"
            >
              Compress all
            </button>
          </section>
        </aside>
        {selected && (
          <section className="min-w-0 rounded-xl border border-zinc-800 bg-[#111113] p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="max-w-md truncate font-medium">
                  {selected.file.name}
                </h2>
                <p className="mono mt-1 text-xs text-zinc-500">
                  {selected.width} × {selected.height} ·{" "}
                  {formatBytes(selected.file.size)} ·{" "}
                  {selected.mime.replace("image/", "").toUpperCase()}
                </p>
              </div>
              {selected.result?.status === "success" && (
                <div className="flex rounded-lg border border-zinc-800 p-1 text-xs">
                  <button
                    onClick={() => setPreview("original")}
                    className={`rounded px-3 py-1.5 ${preview === "original" ? "bg-zinc-700 text-white" : "text-zinc-500"}`}
                  >
                    Original
                  </button>
                  <button
                    onClick={() => setPreview("compressed")}
                    className={`rounded px-3 py-1.5 ${preview === "compressed" ? "bg-zinc-700 text-white" : "text-zinc-500"}`}
                  >
                    Compressed
                  </button>
                </div>
              )}
            </div>
            <div className="mt-5 flex min-h-[360px] items-center justify-center overflow-hidden rounded-lg border border-zinc-800 bg-[#0c0c0e] p-4">
              <img
                src={
                  preview === "compressed" && selected.resultUrl
                    ? selected.resultUrl
                    : selected.previewUrl
                }
                alt={`Preview of ${selected.file.name}`}
                className="max-h-[560px] max-w-full object-contain"
              />
            </div>
            {selected.status === "processing" && (
              <p role="status" className="mt-5 text-sm text-zinc-300">
                Processing image…
              </p>
            )}
            {selected.error && (
              <div
                role="alert"
                className="mt-5 rounded-lg border border-amber-900/70 bg-amber-950/20 p-4 text-sm text-amber-200"
              >
                <p>{selected.error}</p>
                {selected.hasAlpha && (
                  <p className="mt-2 text-amber-300/70">
                    Transparency is preserved by default. Converting formats can
                    change compatibility.
                  </p>
                )}
              </div>
            )}
            {selected.result?.status === "success" && (
              <div className="mt-5 flex flex-col gap-4 rounded-lg border border-zinc-800 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-zinc-500">Original</p>
                    <p className="mono mt-1 text-sm">
                      {formatBytes(selected.file.size)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Compressed</p>
                    <p className="mono mt-1 text-sm">
                      {formatBytes(selected.result.blob.size)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Saved</p>
                    <p className="mono mt-1 text-sm">
                      {Math.max(
                        0,
                        Math.round(
                          (1 - selected.result.blob.size / selected.file.size) *
                            100,
                        ),
                      )}
                      %
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Output</p>
                    <p className="mono mt-1 text-sm">
                      {selected.result.width} × {selected.result.height}
                    </p>
                    <p className="mono mt-1 text-[11px] text-zinc-500">
                      {selected.result.mime.replace("image/", "").toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  className="button button-primary"
                  onClick={() => individual(selected)}
                >
                  <Download size={16} />
                  Download image
                </button>
              </div>
            )}
            <div className="mt-4 flex flex-wrap justify-between gap-2">
              <button
                className="text-sm text-zinc-500 hover:text-white"
                onClick={() => compressionStore.remove(selected.id)}
              >
                <Trash2 className="mr-1 inline" size={14} />
                Remove image
              </button>
              {state.items.filter((i) => i.result?.status === "success")
                .length > 1 && (
                <button
                  className="button button-secondary"
                  onClick={() => void zipAll()}
                >
                  <Download size={16} />
                  Download all as ZIP
                </button>
              )}
            </div>
          </section>
        )}
      </div>
      <p className="mt-6 text-xs leading-5 text-zinc-600">
        Processing happens locally. Re-encoding may remove EXIF metadata and
        embedded color profiles.
      </p>
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
    </main>
  );
}
