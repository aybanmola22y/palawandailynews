"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { usePathname } from "next/navigation";
import { Search, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { useScrolled } from "@/hooks/use-scrolled";
import { setScrollPaused } from "@/lib/smooth-scroll";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", path: "/" },
  { label: "Latest News", path: "/latest" },
  { label: "Opinion", path: "/opinion" },
  { label: "Legal", path: "/legal" },
  { label: "Lifestyle", path: "/lifestyle" },
  { label: "Advertise", path: "/advertise" },
  { label: "About", path: "/about" },
];

function AnimatedMenuIcon({ open }: { open: boolean }) {
  return (
    <div
      className="relative flex h-[22px] w-[22px] flex-col items-center justify-center"
      aria-hidden
    >
      <span
        className={cn(
          "absolute block h-[2px] w-[22px] rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-y-0 rotate-45" : "-translate-y-7px",
        )}
      />
      <span
        className={cn(
          "absolute block h-[2px] w-[22px] rounded-full bg-current transition-all duration-200 ease-out",
          open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100",
        )}
      />
      <span
        className={cn(
          "absolute block h-[2px] w-[22px] rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-y-0 -rotate-45" : "translate-y-[7px]",
        )}
      />
    </div>
  );
}

export function Header() {
  const location = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrolled = useScrolled(12);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    setScrollPaused(mobileMenuOpen);
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-background/90 backdrop-blur-md border-b border-border shadow-sm"
            : "bg-background border-b border-border",
        )}
        data-testid="site-header"
      >
        <div className="editorial-container h-[76px] flex items-center gap-6 lg:gap-11">
          <Link
            href="/"
            className="shrink-0 group block"
            data-testid="link-home"
          >
            <SiteLogo
              priority
              className="transition-opacity group-hover:opacity-90"
            />
          </Link>

          <div className="hidden md:block h-10 w-px bg-border shrink-0" />

          <nav
            className="hidden md:flex items-center gap-0.5 flex-1 justify-center"
            aria-label="Main navigation"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "relative px-3.5 py-2.5 text-[12px] uppercase tracking-widest font-semibold rounded-sm transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80",
                  )}
                  data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-1 left-3.5 right-3.5 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            <Link
              href="/search"
              className="w-10 h-10 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              data-testid="link-search"
              aria-label="Search"
            >
              <Search className="w-[18px] h-[18px]" />
            </Link>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Toggle theme"
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? (
                <Sun className="w-[18px] h-[18px]" />
              ) : (
                <Moon className="w-[18px] h-[18px]" />
              )}
            </button>
            <button
              type="button"
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              data-testid="button-mobile-menu"
            >
              <AnimatedMenuIcon open={mobileMenuOpen} />
            </button>
          </div>
        </div>
      </header>

      <div className="h-[77px]" />

      <AnimatePresence>
        {mobileMenuOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              data-lenis-prevent
              className="fixed inset-0 top-[77px] z-40 bg-black/50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.nav
              data-lenis-prevent
              className="fixed left-0 right-0 top-[77px] bottom-0 z-40 flex flex-col overflow-y-auto border-t border-border bg-background p-2 md:hidden"
              aria-label="Mobile navigation"
              data-testid="mobile-menu-drawer"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              {NAV_ITEMS.map((item, index) => {
                const isActive = location === item.path;
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{
                      duration: 0.28,
                      delay: index * 0.045,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Link
                      href={item.path}
                      className={cn(
                        "flex items-center justify-between mx-2 px-4 py-4 rounded-sm text-widest uppercase tracking-widest font-semibold transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                      )}
                      data-testid={`link-mobile-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {item.label}
                      {isActive ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      ) : null}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.nav>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
