import { ImageResponse } from "next/og";
export const alt = "ImageLab, free private image compression";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() { return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, color: "#fafafa", background: "#09090b", fontFamily: "sans-serif" }}><div style={{ fontSize: 30, color: "#a1a1aa" }}>ImageLab</div><div style={{ marginTop: 42, maxWidth: 900, fontSize: 78, lineHeight: 1.05, letterSpacing: "-4px", fontWeight: 650 }}>Make your images smaller.</div><div style={{ marginTop: 35, fontSize: 28, color: "#a1a1aa" }}>Free, fast, and private browser compression.</div></div>, size); }
