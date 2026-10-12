import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

describe("technical SEO", () => {
  it("allows preset routes while excluding only the private workspace", () => {
    expect(robots().rules).toMatchObject({ userAgent: "*", allow: "/", disallow: "/compress$" });
    expect(sitemap().some((entry) => entry.url.endsWith("/compress"))).toBe(false);
    expect(sitemap().filter((entry) => entry.url.includes("compress-image-to-")).length).toBe(6);
  });

  it("never defaults canonicals to localhost", () => {
    expect(sitemap()[0].url).toMatch(/^https:\/\//);
  });
});
