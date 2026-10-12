import type { MetadataRoute } from "next";
import { PRESETS } from "@/lib/seo/presets";
const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://imagelab.vercel.app";
export default function sitemap(): MetadataRoute.Sitemap { return ["", "/about", "/privacy", ...PRESETS.map((preset) => `/compress-image-to-${preset.slug}`)].map((path) => ({ url: `${origin}${path}`, changeFrequency: path === "" ? "weekly" : "monthly", priority: path === "" ? 1 : path.startsWith("/compress-image") ? 0.8 : 0.5 })); }
