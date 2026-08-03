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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Palawan Daily News",
    template: "%s | Palawan Daily News",
  },
  description:
    "Independent news from Palawan — city and provincial news, opinion, lifestyle, and public notices.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: siteUrl,
    siteName: "Palawan Daily News",
    title: "Palawan Daily News",
    description:
      "Independent news from Palawan — city and provincial news, opinion, lifestyle, and public notices.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Palawan Daily News",
    description:
      "Independent news from Palawan — city and provincial news, opinion, lifestyle, and public notices.",
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
