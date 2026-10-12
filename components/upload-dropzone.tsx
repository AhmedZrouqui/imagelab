"use client";
import { useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { MAX_FILES } from "@/lib/constants";
import { validateFile } from "@/lib/files/validate";
import { compressionStore } from "@/stores/compression-store";

export function UploadDropzone({ compact = false, targetBytes }: { compact?: boolean; targetBytes?: number }) {
  const input = useRef<HTMLInputElement>(null); const router = useRouter();
  const [dragging, setDragging] = useState(false); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const ready = useSyncExternalStore(() => () => undefined, () => true, () => false);
  async function accept(list: FileList | File[]) { setBusy(true); setError(""); const files = Array.from(list).slice(0, MAX_FILES); let bytes = compressionStore.getSnapshot().items.reduce((n, item) => n + item.file.size, 0); const errors: string[] = []; for (const file of files) { const result = await validateFile(file, bytes); if (result.ok) { compressionStore.addValidated(file, { ...result, hasAlpha: result.mime === "image/png" }); bytes += file.size; } else errors.push(`${file.name}: ${result.message}`); } compressionStore.setInitialTarget(targetBytes); setBusy(false); if (errors.length) setError(errors.join(" ")); if (compressionStore.getSnapshot().items.length) router.push("/compress"); }
  function openPicker(event?: React.SyntheticEvent) { if (ready && event?.target !== input.current) input.current?.click(); }
  return <div>
    <div role="button" tabIndex={ready ? 0 : -1} aria-disabled={!ready} aria-label="Choose images" onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openPicker(event); } }} onClick={openPicker} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); if (ready) void accept(event.dataTransfer.files); }} className={`rounded-2xl border border-dashed p-7 text-center transition sm:p-12 ${ready ? "cursor-pointer" : "cursor-wait opacity-70"} ${dragging ? "border-white bg-zinc-800" : "border-zinc-700 bg-[#111113] hover:border-zinc-500 hover:bg-zinc-900"} ${compact ? "sm:p-7" : ""}`}>
      <input ref={input} className="sr-only" type="file" disabled={!ready} accept="image/jpeg,image/png,image/webp" multiple onClick={(event) => event.stopPropagation()} onChange={(event) => event.target.files && void accept(event.target.files)} />
      <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900"><Upload size={20} aria-hidden="true" /></div>
      <p className="text-lg font-medium">{busy ? "Checking images..." : "Drop your images here"}</p><p className="mt-1 text-sm text-zinc-400">or click to browse</p><p className="mt-5 text-xs text-zinc-600">JPG, PNG, or WebP · up to 30 MB each</p>
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
  </div>;
}
