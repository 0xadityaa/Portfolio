import { SiteHeader } from "@/components/site-header";
import { DATA } from "@/data/resume";
import { pageAlternates } from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
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

const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  style: ["normal", "italic"],
});

export const viewport: Viewport = {
  themeColor: "#262624",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(DATA.url),
  title: {
    default: `${DATA.name} - ${DATA.role}`,
    template: `%s | ${DATA.name}`,
  },
  description: DATA.description,
  alternates: pageAlternates("/"),
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
    <html lang="en" className={cn("scroll-smooth", geistSans.variable, geistMono.variable, serif.variable)}>
      <body className="min-h-[100dvh] bg-background font-sans text-[15px] leading-7 antialiased">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-3 focus:py-2 focus:text-sm focus:text-background"
        >
          Skip to content
        </a>
        <div className="mx-auto w-full max-w-5xl px-6 pb-16 pt-8 sm:pt-12">
          <SiteHeader />
          <div id="content">{children}</div>
          <footer className="mt-24 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span>
              &copy; {new Date().getFullYear()} {DATA.name}
            </span>
            <nav aria-label="Footer" className="flex items-center gap-5">
              <Link href="/rss.xml" prefetch={false} className="transition-colors hover:text-foreground">
                RSS
              </Link>
              <Link href="/llms.txt" prefetch={false} className="transition-colors hover:text-foreground">
                llms.txt
              </Link>
              <a href={DATA.repo} className="transition-colors hover:text-foreground">
                Source
              </a>
            </nav>
          </footer>
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
