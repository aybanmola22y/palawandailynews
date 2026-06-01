"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { scrollToHash, scrollToTop } from "@/lib/smooth-scroll";

export { scrollToHash } from "@/lib/smooth-scroll";

export function SmoothScroll() {
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
    scrollToTop(true);

    const hash = window.location.hash;
    if (!hash) return;

    const run = () => scrollToHash(hash);
    requestAnimationFrame(run);
    const t = window.setTimeout(run, 150);

    return () => window.clearTimeout(t);
  }, [pathname]);

  return null;
}
