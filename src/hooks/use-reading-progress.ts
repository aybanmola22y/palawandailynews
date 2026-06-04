import { useState, useEffect } from "react";
import { getScrollTop, subscribeScroll } from "@/lib/smooth-scroll";

function readProgress() {
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollHeight <= 0) return 0;
  return Math.min(100, Math.max(0, (getScrollTop() / scrollHeight) * 100));
}

export function useReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let rafId = 0;

    const commit = () => {
      rafId = 0;
      setProgress(readProgress());
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(commit);
    };

    commit();
    const unsubscribe = subscribeScroll(onScroll);
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      unsubscribe();
      window.removeEventListener("resize", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return progress;
}
