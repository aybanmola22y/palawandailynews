import { useState, useEffect } from "react";

function readProgress() {
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollHeight <= 0) return 0;
  return Math.min(100, Math.max(0, (window.scrollY / scrollHeight) * 100));
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
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return progress;
}
