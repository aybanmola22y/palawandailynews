"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { ArticlesProvider } from "@/store/articles-context";
import { AdsProvider } from "@/store/ads-context";
import { MediaProvider } from "@/store/media-context";
import { UsersProvider } from "@/store/users-context";
import { StaffProvider } from "@/store/staff-context";
import { useUsers } from "@/store/users-context";
import { useArticles } from "@/store/articles-context";
import { columnists } from "@/data/columnists";

function StaffProviders({ children }: { children: React.ReactNode }) {
  const { users } = useUsers();
  const { articles } = useArticles();
  return (
    <StaffProvider
      seedFromUsers={users}
      seedFromArticles={articles}
      seedFromColumnists={columnists.map((c) => ({
        name: c.name,
        role: c.role,
        bio: c.bio,
      }))}
    >
      {children}
    </StaffProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ArticlesProvider>
        <AdsProvider>
          <MediaProvider>
            <UsersProvider>
              <StaffProviders>
                <TooltipProvider>
                  {children}
                  <Toaster />
                </TooltipProvider>
              </StaffProviders>
            </UsersProvider>
          </MediaProvider>
        </AdsProvider>
      </ArticlesProvider>
    </ThemeProvider>
  );
}
