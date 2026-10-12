import type { MetadataRoute } from "next";
const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://imagelab.vercel.app";
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: "/", disallow: "/compress$" }, sitemap: `${origin}/sitemap.xml` }; }
