import { describe, expect, it } from "vitest";
import { detectImageType } from "@/lib/files/signatures";
import { compressedName } from "@/lib/files/names";
import { formatBytes } from "@/lib/files/format";

describe("file utilities", () => {
  it("detects supported signatures", () => {
    expect(detectImageType(new Uint8Array([0xff, 0xd8, 0xff]))).toBe("image/jpeg");
    expect(detectImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(detectImageType(new TextEncoder().encode("RIFF1234WEBP"))).toBe("image/webp");
  });

  it("formats sizes and resolves filename collisions", () => {
    expect(formatBytes(1000)).toBe("1 KB");
    expect(compressedName("photo.jpg", "image/jpeg", new Set(["photo-compressed.jpg"]))).toBe("photo-compressed-2.jpg");
  });
});
