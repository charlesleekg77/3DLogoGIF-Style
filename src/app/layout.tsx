import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "@/styles/globals.css";

/**
 * Root layout — the document shell only.
 *
 * Header, footer, smooth scroll and the decorative background layers live in the
 * `(site)` route group so that `/embed/[id]` can opt out of all of them. An embed
 * must not import this site's chrome into someone else's page.
 *
 * Typography: three faces, three jobs.
 *   - Space Grotesk (display) — headings and the wordmark.
 *   - Inter (sans)           — body copy and controls.
 *   - JetBrains Mono (mono)  — render metadata: resolution, FPS, rotation.
 *
 * `next/font` self-hosts these and inlines the `@font-face` rules, so there is no
 * layout shift and no third-party request at runtime.
 */
const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://3dlogogif.studio"),
  title: {
    default: "3DLogoGIF — Real-time 3D logo loops, rendered in your browser",
    template: "%s · 3DLogoGIF",
  },
  description:
    "Turn any SVG or transparent PNG into a polished, endlessly looping 3D logo animation. Real-time WebGL studio, transparent GIF/MP4 export, no plugins.",
  keywords: [
    "3D logo",
    "logo animation",
    "GIF maker",
    "WebGL",
    "Three.js",
    "brand loop",
    "SVG to 3D",
  ],
  openGraph: {
    type: "website",
    title: "3DLogoGIF — Real-time 3D logo loops",
    description:
      "Upload an SVG, pick a material, export a transparent GIF. The whole studio runs client-side.",
    siteName: "3DLogoGIF",
  },
  twitter: {
    card: "summary_large_image",
    title: "3DLogoGIF — Real-time 3D logo loops",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="relative min-h-screen overflow-x-hidden">{children}</body>
    </html>
  );
}
