import { beforeEach, describe, expect, it, vi } from "vitest";
import { compressionStore } from "@/stores/compression-store";

describe("compression store", () => {
  beforeEach(() => compressionStore.reset());
  it("owns and releases preview URLs", () => {
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:test"), revokeObjectURL: vi.fn() });
    const item = compressionStore.addValidated(new File(["x"], "a.jpg", { type: "image/jpeg" }), { mime: "image/jpeg", width: 1, height: 1 });
    compressionStore.remove(item.id);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });
});
