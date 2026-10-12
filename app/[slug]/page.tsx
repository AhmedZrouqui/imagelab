import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { UploadDropzone } from "@/components/upload-dropzone";
import { PresetLinks } from "@/components/preset-links";
import { PRESETS, getPreset } from "@/lib/seo/presets";

type Props = { params: Promise<{ slug: string }> };
function presetForSlug(slug: string) { const prefix = "compress-image-to-"; return slug.startsWith(prefix) ? getPreset(slug.slice(prefix.length)) : undefined; }
export const instant = false;
export function generateStaticParams() { return PRESETS.map((preset) => ({ slug: `compress-image-to-${preset.slug}` })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const preset = presetForSlug(slug); if (!preset) return {}; return { title: preset.title, description: preset.description, alternates: { canonical: `/${slug}` }, openGraph: { title: preset.title, description: preset.description, url: `/${slug}` } }; }
export default async function TargetPage({ params }: Props) { const { slug } = await params; const preset = presetForSlug(slug); if (!preset) notFound(); return <><SiteHeader /><main id="main"><section className="shell pt-16 text-center sm:pt-24"><p className="mono text-xs text-zinc-500">MAXIMUM OUTPUT · {preset.label}</p><h1 className="mt-4 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">{preset.title}</h1><p className="mx-auto mt-5 max-w-2xl leading-7 text-zinc-400">{preset.description}</p><div className="mx-auto mt-9 max-w-3xl"><UploadDropzone targetBytes={preset.bytes} /></div></section><section className="shell mt-20 grid max-w-4xl gap-10 border-t border-zinc-800 pt-12 md:grid-cols-2"><div><h2 className="text-xl font-semibold">When {preset.label} makes sense</h2><p className="mt-3 leading-7 text-zinc-400">{preset.use}</p><p className="mt-4 leading-7 text-zinc-400">Choose images above. The workspace starts with {preset.label} selected, and you can adjust the limit before processing a batch.</p></div><div><h2 className="text-xl font-semibold">A maximum, not a promise</h2><p className="mt-3 leading-7 text-zinc-400">Complex images may need lower quality or smaller dimensions. Transparent PNG files can be difficult to shrink because PNG does not use a JPEG-style quality control.</p><p className="mt-4 leading-7 text-zinc-400">ImageLab reports when a target cannot be reached safely instead of presenting an oversized result as success.</p></div></section><section className="shell mt-16 max-w-4xl"><h2 className="mb-4 text-lg font-semibold">Related size tools</h2><PresetLinks current={preset.slug} /></section></main><SiteFooter /></>; }
