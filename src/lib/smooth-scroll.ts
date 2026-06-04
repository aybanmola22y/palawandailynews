import type Lenis from "lenis";

/** Snappy smooth wheel — higher lerp = less float/lag behind the input. */
export const LENIS_OPTIONS: ConstructorParameters<typeof Lenis>[0] = {
  autoRaf: true,
  lerp: 0.14,
  wheelMultiplier: 1,
  touchMultiplier: 1,
  smoothWheel: true,
  syncTouch: false,
  anchors: true,
};

const HEADER_SCROLL_OFFSET = -88;

let lenisInstance: Lenis | null = null;

export function setLenisInstance(instance: Lenis | null) {
  lenisInstance = instance;
}

export function getLenis() {
  return lenisInstance;
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isSmoothScrollEnabled() {
  return !prefersReducedMotion();
}

export function initLenis(instance: Lenis) {
  lenisInstance = instance;
  return instance;
}

export function destroyLenis() {
  lenisInstance = null;
}

export function getScrollTop() {
  return lenisInstance?.scroll ?? window.scrollY;
}

export function subscribeScroll(listener: () => void) {
  const lenis = lenisInstance;
  if (lenis) {
    lenis.on("scroll", listener);
    return () => lenis.off("scroll", listener);
  }

  window.addEventListener("scroll", listener, { passive: true });
  return () => window.removeEventListener("scroll", listener);
}

export function scrollToTop(immediate = true) {
  const lenis = lenisInstance;
  if (lenis) {
    lenis.scrollTo(0, { immediate });
    return;
  }

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: immediate ? "auto" : "smooth",
  });
}

export function scrollToHash(hash: string) {
  const id = hash.replace(/^#/, "");
  if (!id) return false;

  const el = document.getElementById(id);
  if (!el) return false;

  const lenis = lenisInstance;
  if (lenis) {
    lenis.scrollTo(el, {
      offset: HEADER_SCROLL_OFFSET,
      duration: 0.9,
      lerp: 0.14,
    });
    return true;
  }

  el.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start",
  });
  return true;
}

export function setScrollPaused(paused: boolean) {
  const lenis = lenisInstance;
  if (!lenis) return;
  if (paused) lenis.stop();
  else lenis.start();
}
