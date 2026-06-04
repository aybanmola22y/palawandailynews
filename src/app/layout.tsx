import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "../index.css";
import { Providers } from "./providers";
import { LenisRoot } from "@/components/layout/LenisRoot";
import { SmoothScroll } from "@/components/layout/SmoothScroll";

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

export const metadata: Metadata = {
  title: "Palawan Daily News",
  description: "Palawan Daily News",
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
