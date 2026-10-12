import Link from "next/link";
export function SiteFooter(){return <footer className="mt-24 border-t hairline"><div className="shell flex flex-col gap-4 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between"><p>ImageLab. Images stay in your browser.</p><div className="flex gap-5"><Link href="/about">About</Link><Link href="/privacy">Privacy</Link></div></div></footer>}
