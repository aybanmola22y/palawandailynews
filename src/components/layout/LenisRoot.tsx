"use client";

import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import type { ReactNode } from "react";
import { LENIS_OPTIONS, isSmoothScrollEnabled } from "@/lib/smooth-scroll";

export function LenisRoot({ children }: { children: ReactNode }) {
  if (!isSmoothScrollEnabled()) {
    return <>{children}</>;
  }

  return (
    <ReactLenis root options={LENIS_OPTIONS}>
      {children}
    </ReactLenis>
  );
}
