import type { Metadata, Viewport } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import ConditionalChrome from "@/components/layout/ConditionalChrome";
import VisitTracker from "@/components/VisitTracker";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  weight: ["400", "500", "700"],
});

const plex = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex",
  weight: ["400", "500", "700"],
});

export const viewport: Viewport = {
  themeColor: "#0a0a08",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TESLA — Technical Club",
    template: "%s | TESLA Technical Club",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "TESLA Technical Club",
    "college technical club",
    "student projects",
    "hackathons",
    "workshops",
    "open source",
  ],
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TESLA",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "TESLA — Technical Club",
    description: SITE_DESCRIPTION,
    url: "/",
    images: [
      {
        url: "/images/tesla-logo-dark.png",
        alt: "TESLA Technical Club",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TESLA — Technical Club",
    description: SITE_DESCRIPTION,
    images: ["/images/tesla-logo-dark.png"],
  },
  robots: {
    index: true,
    follow: true,
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
      className={`dark ${grotesk.variable} ${plex.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground overflow-x-hidden">
        <VisitTracker />
        <ConditionalChrome>{children}</ConditionalChrome>
      </body>
    </html>
  );
}
