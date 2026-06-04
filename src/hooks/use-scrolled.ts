import { useState, useEffect } from "react";
import { getScrollTop, subscribeScroll } from "@/lib/smooth-scroll";

export function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let rafId = 0;

    const commit = () => {
      rafId = 0;
      setScrolled(getScrollTop() > threshold);
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(commit);
    };

    commit();
    const unsubscribe = subscribeScroll(onScroll);

    return () => {
      unsubscribe();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [threshold]);

  return scrolled;
}
