import type { SupportedMime } from "@/lib/files/types";
export type OutputChoice = "preserve" | SupportedMime;
export interface ImageSource { file: File; width: number; height: number; mime: SupportedMime; hasAlpha: boolean }
export interface EncodeRequest { source: ImageSource; quality: number; scale: number; mime: SupportedMime }
export type Encoder = (request: EncodeRequest) => Promise<Blob>;
export type CompressionResult = { status: "success"; blob: Blob; width: number; height: number; mime: SupportedMime; attempts: number } | { status: "limited"; reason: "already-optimized" | "unreachable-target" | "cancelled" | "processing-failed"; message: string; best?: Blob };
