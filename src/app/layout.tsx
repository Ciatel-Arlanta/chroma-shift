import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.startsWith("http")
      ? process.env.NEXT_PUBLIC_SITE_URL
      : `https://${process.env.NEXT_PUBLIC_SITE_URL}`;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://chromashift.dev";
}

const SITE_URL = getBaseUrl();

export const metadata: Metadata = {
  title: {
    default: "ChromaShift — Deterministic UI Theme Remapper",
    template: "%s | ChromaShift",
  },
  description:
    "Upload a UI screenshot or SVG and instantly generate production-ready themes. Browser-side processing, no AI APIs, fully deterministic.",
  keywords: [
    "theme generator",
    "UI remapping",
    "color palette",
    "screenshot to theme",
    "design tool",
    "accessibility",
    "CSS variables",
    "Tailwind theme",
  ],
  authors: [{ name: "ChromaShift" }],
  creator: "ChromaShift",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "ChromaShift",
    title: "ChromaShift — Deterministic UI Theme Remapper",
    description:
      "Turn any product screenshot into a polished, shareable theme concept. Browser-side, API-free, instant output.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChromaShift — Deterministic UI Theme Remapper",
    description:
      "Upload a screenshot. Get 6 polished theme variants. Export CSS, Tailwind, or JSON. All in the browser.",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function() {
              try {
                var stored = localStorage.getItem("chroma-shift-theme");
                var theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
                document.documentElement.dataset.theme = theme;
              } catch (e) {}
            })();
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
