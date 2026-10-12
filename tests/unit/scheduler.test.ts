import { describe, expect, it } from "vitest";
import { runWithConcurrency } from "@/lib/compression/scheduler";

describe("batch scheduler", () => {
  it("caps concurrent jobs", async () => {
    let active = 0; let maximum = 0;
    await runWithConcurrency([1, 2, 3, 4], async () => { active++; maximum = Math.max(maximum, active); await Promise.resolve(); active--; }, 2);
    expect(maximum).toBe(2);
  });
});
