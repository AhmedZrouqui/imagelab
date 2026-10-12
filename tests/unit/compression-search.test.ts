import { describe, expect, it } from "vitest";
import { compressToTarget, compressAutomatic } from "@/lib/compression/engine";
import type { EncodeRequest, ImageSource } from "@/lib/compression/types";

const source: ImageSource = { file: new File([new Uint8Array(200_000)], "photo.jpg", { type: "image/jpeg" }), width: 1600, height: 900, mime: "image/jpeg", hasAlpha: false };

describe("compression engine", () => {
  it("returns a candidate below a maximum target", async () => {
    const encode = async (request: EncodeRequest) => new Blob([new Uint8Array(Math.round(160_000 * request.quality * request.scale * request.scale))], { type: request.mime });
    const result = await compressToTarget(source, 100_000, "preserve", encode);
    expect(result.status).toBe("success");
    if (result.status === "success") expect(result.blob.size).toBeLessThanOrEqual(100_000);
  });

  it("does not claim an automatic improvement when output is larger", async () => {
    const result = await compressAutomatic(source, async (r) => new Blob([new Uint8Array(210_000)], { type: r.mime }));
    expect(result.status).toBe("limited");
    if (result.status === "limited") expect(result.reason).toBe("already-optimized");
  });

  it("honors cancellation", async () => {
    const controller = new AbortController(); controller.abort();
    const result = await compressToTarget(source, 1000, "preserve", async (r) => new Blob([], { type: r.mime }), controller.signal);
    expect(result).toMatchObject({ status: "limited", reason: "cancelled" });
  });
});
