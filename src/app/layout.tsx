import type { Metadata } from "next";
import "../index.css";
import { Providers } from "./providers";
import { SmoothScroll } from "@/components/layout/SmoothScroll";

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
    <html lang="en" suppressHydrationWarning>
      <body>
        <SmoothScroll />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

