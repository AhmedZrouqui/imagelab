export type SupportedMime = "image/jpeg" | "image/png" | "image/webp";
export type ValidationErrorCode = "unsupported-type" | "invalid-signature" | "file-too-large" | "batch-too-large" | "decode-failed" | "dimensions-too-large";
export type ValidationResult = { ok: true; mime: SupportedMime; width: number; height: number } | { ok: false; code: ValidationErrorCode; message: string };
