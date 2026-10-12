import { describe, expect, it } from "vitest";

describe("test foundation", () => {
  it("resolves the application alias", async () => {
    const constants = await import("@/lib/constants");
    expect(constants.APP_NAME).toBe("ImageLab");
  });
});
