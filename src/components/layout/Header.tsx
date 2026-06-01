"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { usePathname } from "next/navigation";
import { Search, Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useScrolled } from "@/hooks/use-scrolled";
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

export function Header() {
  const location = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrolled = useScrolled(12);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
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
                    "relative px-3.5 py-2.5 text-[12px] uppercase tracking-[0.1em] font-semibold rounded-sm transition-colors",
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
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              data-testid="button-mobile-menu"
            >
              <Menu className="w-[22px] h-[22px]" />
            </button>
          </div>
        </div>
      </header>

      <div className="h-[77px]" />

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-background flex flex-col"
          data-testid="mobile-menu-drawer"
        >
          <div className="h-[77px] flex items-center justify-between px-6 border-b border-border">
            <Link
              href="/"
              className="block shrink-0"
              data-testid="link-mobile-home"
            >
              <SiteLogo className="h-8 max-w-[200px] sm:max-w-[220px]" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-sm hover:bg-secondary"
              data-testid="button-close-menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex flex-col flex-1 overflow-y-auto p-2">
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center justify-between mx-2 px-4 py-4 rounded-sm text-[12px] uppercase tracking-[0.1em] font-semibold transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  )}
                  data-testid={`link-mobile-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {item.label}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
