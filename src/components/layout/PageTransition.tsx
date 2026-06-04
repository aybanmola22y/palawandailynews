"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

const variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

type PageTransitionProps = {
  children: ReactNode;
  /** Slightly faster for admin panels */
  variant?: "site" | "admin";
};

/**
 * SSR/hydration: render a plain wrapper until mounted, then enable motion.
 * Framer Motion inline styles on the server do not match the client snapshot.
 */
export function PageTransition({
  children,
  variant = "site",
}: PageTransitionProps) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || reduced) {
    return <div className="min-h-0">{children}</div>;
  }

  const duration = variant === "admin" ? 0.28 : 0.38;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration, ease: EASE }}
        className="min-h-0"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
