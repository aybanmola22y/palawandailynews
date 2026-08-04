"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { scrollToTop } from "@/lib/smooth-scroll";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

type PaginatedListTransitionProps = {
  page: number;
  children: ReactNode;
  className?: string;
};

/**
 * Fade/slide the list when pagination changes, and smooth-scroll to top —
 * shared by Latest News and Opinion.
 */
export function PaginatedListTransition({
  page,
  children,
  className,
}: PaginatedListTransitionProps) {
  const reduced = useReducedMotion();
  const didMountRef = useRef(false);
  const prevPageRef = useRef(page);
  const directionRef = useRef(1);

  if (page !== prevPageRef.current) {
    directionRef.current = page > prevPageRef.current ? 1 : -1;
    prevPageRef.current = page;
  }
  const direction = directionRef.current;

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    let rafId = 0;
    rafId = requestAnimationFrame(() => {
      rafId = requestAnimationFrame(() => scrollToTop(false));
    });
    const timeoutId = window.setTimeout(() => scrollToTop(false), 90);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [page]);

  if (reduced) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <motion.div
        key={page}
        custom={direction}
        initial="enter"
        animate="center"
        exit="exit"
        variants={{
          enter: (dir: number) => ({
            opacity: 0,
            y: dir > 0 ? 22 : -22,
          }),
          center: {
            opacity: 1,
            y: 0,
          },
          exit: (dir: number) => ({
            opacity: 0,
            y: dir > 0 ? -16 : 16,
          }),
        }}
        transition={{ duration: 0.34, ease: EASE }}
        className={cn(className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
