import type { Metadata } from "next";
import "./globals.css";
import Navbar from "app/components/Navbar";
import { siteMetadata } from "app/data/siteMetadata";
import { Footer } from "./components/Footer";
import { cx } from "./lib/utils";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Instrument_Serif, JetBrains_Mono, Source_Serif_4, Space_Grotesk } from "next/font/google";
import Script from "next/script";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

// Sturdy semibold serif for organization names in the experience timeline.
const sourceSerif = Source_Serif_4({
  weight: "600",
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

// Hero scramble headline — exact font from the decode reference; mono
// metrics keep the glyph scramble perfectly width-stable.
const jetbrainsMono = JetBrains_Mono({
  weight: "700",
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});
import { ThemeProvider } from "./components/ThemeProvider";
import { ChatbotWidget } from "./components/ChatbotWidget";

import { getPublicSupabase } from "@/app/lib/supabase/safe";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteMetadata.title,
  url: siteMetadata.siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteMetadata.siteUrl}/blog?category={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  let title = siteMetadata.title;
  let description = siteMetadata.description;
  
  try {
    // Anonymous client (no cookies) so metadata reads don't force every route dynamic.
    const supabase = getPublicSupabase();
    const { data: settings } = supabase
      ? await supabase.from('site_settings').select('*').limit(1).single()
      : { data: null };

    if (settings) {
      if (settings.site_name) title = `${settings.site_name} | Portfolio`;
      if (settings.seo_description) description = settings.seo_description;
    }
  } catch (e) {
    console.error("Failed to load dynamic metadata", e);
  }

  return {
    metadataBase: new URL(siteMetadata.siteUrl),
    title: {
      default: title,
      template: `%s | ${title.split(' | ')[0]}`
    },
    description: description,
    icons: {
      icon: "/brand/harisx404 favicon transparent.png",
      apple: "/brand/harisx404 favicon transparent.png",
      shortcut: "/brand/harisx404 favicon transparent.png",
    },
    openGraph: {
      title: title,
      description: description,
      images: [
        {
          url: `${siteMetadata.siteUrl}/brand/logo-wide.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [`${siteMetadata.siteUrl}/brand/logo-wide.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`bg-bg-primary ${GeistMono.variable} ${GeistSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} ${sourceSerif.variable} ${spaceGrotesk.variable}`}
    >
      <body className="flex min-h-screen flex-col font-sans md:max-w-7xl lg:mx-auto lg:flex-row" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <main
          className={cx(
            "relative flex flex-1 flex-col overflow-x-clip border-x border-border-primary/50",
          )}
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:border focus:border-border-primary focus:bg-bg-primary focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:text-text-primary"
          >
            Skip to content
          </a>
          <Navbar />
          <div className="grid flex-1 grid-cols-[14px_minmax(0,1fr)_14px] sm:grid-cols-[20px_minmax(0,1fr)_20px] lg:grid-cols-[32px_minmax(0,1fr)_32px]">
            <div className="block w-full border-r border-border-primary opacity-75 [background-image:linear-gradient(45deg,theme(colors.border-primary)_12.50%,transparent_12.50%,transparent_50%,theme(colors.border-primary)_50%,theme(colors.border-primary)_62.50%,transparent_62.50%,transparent_100%)] [background-size:5px_5px]"></div>
            <div id="main-content" className="relative col-span-1 min-w-0 px-2 pt-16 sm:px-3 sm:pt-20 lg:px-0">
              {children}
            </div>
            <div className="block w-full border-l border-border-primary opacity-75 [background-image:linear-gradient(45deg,theme(colors.border-primary)_12.50%,transparent_12.50%,transparent_50%,theme(colors.border-primary)_50%,theme(colors.border-primary)_62.50%,transparent_62.50%,transparent_100%)] [background-size:5px_5px]"></div>
          </div>
          <Footer />
        </main>
        <ChatbotWidget />
        </ThemeProvider>
      </body>

      {/* TODO: Replace Vemetric token with your own analytics or remove entirely */}
      {/* Uncomment below and add your own analytics token when ready */}
      {/*
      <Script id="analytics-loader" strategy="afterInteractive">
        {`
          window.vmtrcq = window.vmtrcq || [];
          window.vmtrc = window.vmtrc || ((...args) => window.vmtrcq.push(args));
        `}
      </Script>
      <Script
        src="https://cdn.vemetric.com/main.js"
        data-token="YOUR_TOKEN_HERE"
        strategy="afterInteractive"
      />
      */}
    </html>
  );
}
