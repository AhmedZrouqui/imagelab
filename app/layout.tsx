import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://imagelab.vercel.app";
export const metadata: Metadata = { metadataBase: new URL(origin), title: { default: "ImageLab — Free Image Compressor to Any File Size", template: "%s | ImageLab" }, description: "Compress JPG, PNG and WebP images to 20KB, 50KB, 100KB, 200KB or any custom size. Free, fast and private. No signup required.", alternates: { canonical: "/" }, openGraph: { title: "ImageLab — Free Image Compressor", description: "Make images smaller in your browser. Free, fast, and private.", url: "/", siteName: "ImageLab", type: "website", images: ["/opengraph-image"] }, twitter: { card: "summary_large_image", title: "ImageLab — Free Image Compressor", description: "Make images smaller in your browser. Free, fast, and private." } };

export default function RootLayout({ children }: LayoutProps<"/">) {
  const jsonLd = { "@context": "https://schema.org", "@type": "WebApplication", name: "ImageLab", applicationCategory: "MultimediaApplication", operatingSystem: "Any modern web browser", description: "A free, private browser-based image compressor for JPG, PNG, and WebP images.", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } };
  return <html lang="en" className={`${sans.variable} ${mono.variable}`}><body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /><a href="#main" className="fixed left-3 top-3 z-50 -translate-y-20 bg-white px-3 py-2 text-black focus:translate-y-0">Skip to content</a>{children}</body></html>;
}
