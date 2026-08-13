import type { Metadata, Viewport } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
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
  title: "TESLA — Technical Club",
  description:
    "TESLA Technical Club. Engineers, coders, designers, and builders shipping real-world work on campus.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TESLA",
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
        <Navbar />
        <main className="flex-grow pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
