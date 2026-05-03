import type { Metadata, Viewport } from "next";
import "./globals.css";

const BASE_URL = "https://bughouse-app.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "Bughouse Chess — Play Online Free",
    template: "%s | Bughouse Chess",
  },
  description:
    "Play bughouse chess online with friends. Free, real-time 4-player chess — no account required.",
  keywords: [
    "bughouse chess",
    "play bughouse online",
    "4 player chess",
    "bughouse chess online free",
    "online chess variant",
  ],
  openGraph: {
    title: "Bughouse Chess — Play Online Free",
    description:
      "Play bughouse chess online with friends. Free, real-time 4-player chess — no account required.",
    url: BASE_URL,
    siteName: "Bughouse Chess",
    type: "website",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Bughouse Chess — 4-player online chess",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bughouse Chess — Play Online Free",
    description: "Play bughouse chess online with friends. Free, real-time 4-player chess.",
    images: [`${BASE_URL}/og-image.png`],
  },
  alternates: {
    canonical: BASE_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Bughouse Chess",
  url: BASE_URL,
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
    <html lang="en" className="h-full">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full bg-base text-primary antialiased font-['DM_Sans',sans-serif]">
        {children}
      </body>
    </html>
  );
}
