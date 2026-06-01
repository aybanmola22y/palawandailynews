/** Native scrolling — instant wheel/trackpad response (no Lenis lag). */

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? "auto" : "smooth";
}

export function getLenis() {
  return null;
}

/** @deprecated Lenis disabled — native scroll is used for responsiveness. */
export function initLenis() {
  return null;
}

/** @deprecated */
export function destroyLenis() {
  /* no-op */
}

export function scrollToTop(immediate = true) {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: immediate ? "auto" : scrollBehavior(),
  });
}

/** In-page anchor — smooth glide without hijacking wheel scrolling. */
export function scrollToHash(hash: string) {
  const id = hash.replace(/^#/, "");
  if (!id) return false;

  const el = document.getElementById(id);
  if (!el) return false;

  el.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
  return true;
}
