import type { Encoder } from "./types";

export const browserEncoder: Encoder = async ({ source, quality, scale, mime }) => {
  const bitmap = await createImageBitmap(source.file, { imageOrientation: "from-image" });
  const width = Math.max(1, Math.round(source.width * scale)); const height = Math.max(1, Math.round(source.height * scale));
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d", { alpha: mime !== "image/jpeg" });
  if (!context) throw new Error("Canvas is unavailable");
  context.drawImage(bitmap, 0, 0, width, height); bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Encoding failed")), mime, mime === "image/png" ? undefined : quality));
  canvas.width = 1; canvas.height = 1; return blob;
};
