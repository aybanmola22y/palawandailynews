import { useState, useEffect } from "react";

export function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let rafId = 0;

    const commit = () => {
      rafId = 0;
      setScrolled(window.scrollY > threshold);
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(commit);
    };

    commit();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [threshold]);

  return scrolled;
}
