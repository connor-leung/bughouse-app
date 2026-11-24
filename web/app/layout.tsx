import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// Fonts are vendored (from Fontsource, OFL) rather than loaded via
// next/font/google, which fails Turbopack builds on Vercel when Google
// returns extensionless font URLs (vercel/next.js#99114).
const dmSans = localFont({
  src: "./fonts/DMSans-Variable.woff2",
  weight: "100 1000",
  style: "normal",
  variable: "--font-dm-sans",
});

const dmMono = localFont({
  src: [
    { path: "./fonts/DMMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/DMMono-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Bughouse Chess — Play Online Free",
    template: "%s | Bughouse Chess",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "bughouse chess",
    "play bughouse online",
    "4 player chess",
    "bughouse chess online free",
    "online chess variant",
  ],
  // The OG/Twitter image comes from app/opengraph-image.tsx
  openGraph: {
    title: "Bughouse Chess — Play Online Free",
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bughouse Chess — Play Online Free",
    description: "Play bughouse chess online with friends. Free, real-time 4-player chess.",
  },
  // Canonical URLs are set per page; a root-level canonical would be
  // inherited by every route and mark them all as duplicates of "/".
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#080e1a',
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description:
    "Free real-time 4-player bughouse chess. Play online with friends, no account required.",
  applicationCategory: "GameApplication",
  genre: "Chess",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${dmSans.variable} ${dmMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="h-full bg-base text-primary antialiased font-sans">
        {children}
      </body>
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  );
}
