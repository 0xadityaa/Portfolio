import Navbar from "@/components/navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DATA } from "@/data/resume";
import { cn } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(DATA.url),
  title: {
    default: `${DATA.name} - ${DATA.role}`,
    template: `%s | ${DATA.name}`,
  },
  description: DATA.description,
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [{ url: "/rss.xml", title: `${DATA.name}'s blog` }],
    },
  },
  openGraph: {
    title: DATA.name,
    description: DATA.description,
    url: DATA.url,
    siteName: DATA.name,
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  twitter: {
    title: DATA.name,
    card: "summary_large_image",
    creator: "@0xadityaa",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark scroll-smooth", geistSans.variable, geistMono.variable)}>
      <body className="min-h-[100dvh] bg-background font-sans antialiased">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-3 focus:py-2 focus:text-sm focus:text-background"
        >
          Skip to content
        </a>
        <TooltipProvider delayDuration={0}>
          <div className="mx-auto w-full max-w-2xl px-6 pt-16 sm:pt-24">
            <div id="content">{children}</div>
            <footer className="mt-24 flex items-center justify-between border-t border-border pb-32 pt-6 text-sm text-muted-foreground">
              <span>
                {DATA.name}, {new Date().getFullYear()}
              </span>
              <nav aria-label="Footer" className="flex items-center gap-5">
                <Link href="/rss.xml" className="transition-colors hover:text-foreground">
                  RSS
                </Link>
                <a href={DATA.contact.social.GitHub.url} className="transition-colors hover:text-foreground">
                  GitHub
                </a>
                <a href={DATA.contact.social.email.url} className="transition-colors hover:text-foreground">
                  Email
                </a>
              </nav>
            </footer>
          </div>
          <Navbar />
        </TooltipProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
