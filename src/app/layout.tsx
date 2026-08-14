import type { Metadata, Viewport } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#d8ff3d",
          colorBackground: "#0a0a08",
        },
        elements: {
          card: "border border-[#2a2a26] bg-[#0a0a08] shadow-2xl rounded-none font-mono",
          headerTitle: "font-bold font-sans text-xl uppercase tracking-wider text-[#efece4]",
          headerSubtitle: "font-mono text-xs text-[#8b897f]",
          formButtonPrimary: "bg-[#d8ff3d] hover:bg-[#efece4] text-[#0a0a08] font-mono text-xs uppercase tracking-widest font-bold rounded-none py-3",
          formFieldInput: "bg-[#111110] border border-[#2a2a26] focus:border-[#d8ff3d] text-[#efece4] font-mono text-sm rounded-none",
          footerActionLink: "text-[#d8ff3d] hover:text-[#efece4] font-mono text-xs",
        },
      }}
    >
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
    </ClerkProvider>
  );
}
