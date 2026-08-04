import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "../index.css";
import { Providers } from "./providers";
import { LenisRoot } from "@/components/layout/LenisRoot";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { getSiteUrl } from "@/lib/site-url";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["400", "500", "600"],
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
  weight: ["400"],
});

const siteUrl = getSiteUrl();

const SITE_NAME = "Palawan Daily News";
const SITE_TAGLINE = "Trusted and Fair Quad Media Network in MIMAROPA";
const DEFAULT_TITLE = `${SITE_NAME} | ${SITE_TAGLINE}`;
const DEFAULT_DESCRIPTION =
  "Independent news from Palawan — city and provincial news, opinion, lifestyle, and public notices.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: siteUrl,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: "/opengraph.jpg",
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/opengraph.jpg"],
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
      suppressHydrationWarning
      className={`${dmSans.variable} ${dmSerif.variable}`}
    >
      <body>
        <LenisRoot>
          <SmoothScroll />
          <Providers>{children}</Providers>
        </LenisRoot>
      </body>
    </html>
  );
}
