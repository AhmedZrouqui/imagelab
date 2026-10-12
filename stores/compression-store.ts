import type { CompressionResult } from "@/lib/compression/types";
import type { SupportedMime } from "@/lib/files/types";

export type ItemStatus = "ready" | "processing" | "completed" | "failed" | "cancelled";
export interface CompressionItem { id: string; file: File; mime: SupportedMime; width: number; height: number; hasAlpha: boolean; previewUrl: string; resultUrl?: string; result?: CompressionResult; status: ItemStatus; error?: string }
export interface StoreSnapshot { items: CompressionItem[]; selectedId?: string; initialTargetBytes?: number; version: number }
let state: StoreSnapshot = { items: [], version: 0 }; const listeners = new Set<() => void>();
const emit = () => { state = { ...state, version: state.version + 1 }; listeners.forEach((listener) => listener()); };
const cleanup = (item: CompressionItem) => { URL.revokeObjectURL(item.previewUrl); if (item.resultUrl) URL.revokeObjectURL(item.resultUrl); };

export const compressionStore = {
  getSnapshot: () => state,
  subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); },
  addValidated(file: File, meta: { mime: SupportedMime; width: number; height: number; hasAlpha?: boolean }) {
    const item: CompressionItem = { id: crypto.randomUUID(), file, ...meta, hasAlpha: meta.hasAlpha ?? meta.mime === "image/png", previewUrl: URL.createObjectURL(file), status: "ready" };
    state = { ...state, items: [...state.items, item], selectedId: state.selectedId ?? item.id }; emit(); return item;
  },
  update(id: string, patch: Partial<CompressionItem>) { state = { ...state, items: state.items.map((item) => item.id === id ? { ...item, ...patch } : item) }; emit(); },
  select(id: string) { state = { ...state, selectedId: id }; emit(); },
  setInitialTarget(bytes?: number) { state = { ...state, initialTargetBytes: bytes }; emit(); },
  remove(id: string) { const item = state.items.find((value) => value.id === id); if (item) cleanup(item); const items = state.items.filter((value) => value.id !== id); state = { ...state, items, selectedId: state.selectedId === id ? items[0]?.id : state.selectedId }; emit(); },
  reset() { state.items.forEach(cleanup); state = { items: [], version: state.version }; emit(); },
};
