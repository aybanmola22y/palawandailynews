"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import {
  destroyLenis,
  initLenis,
  scrollToHash,
  scrollToTop,
  isSmoothScrollEnabled,
} from "@/lib/smooth-scroll";

export { scrollToHash } from "@/lib/smooth-scroll";

function SmoothScrollEffects() {
  const pathname = usePathname();
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) {
      destroyLenis();
      return;
    }
    initLenis(lenis);
    return () => destroyLenis();
  }, [lenis]);

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a[href^="#"]');
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const hash = anchor.hash;
      if (!hash || hash === "#") return;

      if (!document.getElementById(hash.slice(1))) return;

      event.preventDefault();
      scrollToHash(hash);
      window.history.pushState(null, "", hash);
    };

    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) scrollToHash(hash);
    };

    document.addEventListener("click", handleAnchorClick, true);
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      document.removeEventListener("click", handleAnchorClick, true);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  useEffect(() => {
    const hash = window.location.hash;

    if (!hash) {
      scrollToTop(true);
      lenis?.resize();
    }

    if (!hash) return;

    const run = () => scrollToHash(hash);
    requestAnimationFrame(run);
    const t = window.setTimeout(run, 200);

    return () => window.clearTimeout(t);
  }, [pathname, lenis]);

  return null;
}

export function SmoothScroll() {
  if (!isSmoothScrollEnabled()) {
    return <SmoothScrollNativeFallback />;
  }

  return <SmoothScrollEffects />;
}

/** Anchor + route scroll when Lenis is off (reduced motion). */
function SmoothScrollNativeFallback() {
  const pathname = usePathname();

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a[href^="#"]');
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const hash = anchor.hash;
      if (!hash || hash === "#") return;
      if (!document.getElementById(hash.slice(1))) return;

      event.preventDefault();
      scrollToHash(hash);
      window.history.pushState(null, "", hash);
    };

    document.addEventListener("click", handleAnchorClick, true);
    return () => document.removeEventListener("click", handleAnchorClick, true);
  }, []);

  useEffect(() => {
    scrollToTop(true);
    const hash = window.location.hash;
    if (hash) scrollToHash(hash);
  }, [pathname]);

  return null;
}
