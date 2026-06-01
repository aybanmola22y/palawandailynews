"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AdminUser } from "@/store/users-context";
import type { Article } from "@/store/articles-context";
import { authorInitials, authorSlug } from "@/lib/author-profile";
import { defaultAuthorProfile } from "@/lib/author-profile-defaults";

export interface StaffProfile {
  id: string;
  name: string;
  profileTitle: string;
  quote: string;
  bio: string;
  badgeLabel: string;
  avatar: string;
  updatedAt: number;
}

const STORAGE_KEY = "pdn_staff";
const STORAGE_VERSION = "v1";
const VERSION_KEY = "pdn_staff_version";

function withDefaults(
  entry: Omit<StaffProfile, "updatedAt" | "avatar" | "profileTitle" | "quote" | "bio" | "badgeLabel"> &
    Partial<Pick<StaffProfile, "updatedAt" | "avatar" | "profileTitle" | "quote" | "bio" | "badgeLabel">>,
  role?: AdminUser["role"],
): StaffProfile {
  const defaults = defaultAuthorProfile(entry.name, role);
  return {
    ...entry,
    profileTitle: entry.profileTitle ?? defaults.profileTitle,
    quote: entry.quote ?? defaults.quote,
    bio: entry.bio ?? defaults.bio,
    badgeLabel: entry.badgeLabel ?? defaults.badgeLabel,
    avatar: entry.avatar ?? authorInitials(entry.name),
    updatedAt: entry.updatedAt ?? Date.now(),
  };
}

function mergeWithSeed(stored: StaffProfile[], seed: StaffProfile[]) {
  const merged: StaffProfile[] = [];
  const byName = new Map<string, StaffProfile>();

  for (const s of stored) byName.set(s.name.trim().toLowerCase(), s);

  for (const seedEntry of seed) {
    const key = seedEntry.name.trim().toLowerCase();
    const existing = byName.get(key);
    merged.push(existing ? { ...seedEntry, ...existing } : seedEntry);
    byName.delete(key);
  }

  // Append extra stored staff not in seed
  for (const extra of byName.values()) merged.push(extra);

  return merged;
}

function loadStaff(seed: StaffProfile[]): StaffProfile[] {
  try {
    const version = localStorage.getItem(VERSION_KEY);
    const stored = localStorage.getItem(STORAGE_KEY);

    if (version !== STORAGE_VERSION) {
      localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
      if (stored) {
        const parsed = JSON.parse(stored) as StaffProfile[];
        const merged = mergeWithSeed(parsed, seed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
      return seed;
    }

    if (stored) {
      const parsed = JSON.parse(stored) as StaffProfile[];
      const merged = mergeWithSeed(parsed, seed);
      // Keep storage in sync so seeded byline authors don't "disappear" after reload.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch {
    /* ignore */
  }
  return seed;
}

function saveStaff(staff: StaffProfile[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(staff));
  } catch {
    /* ignore */
  }
}

type StaffContextType = {
  staff: StaffProfile[];
  addStaff: (entry: Omit<StaffProfile, "id" | "updatedAt" | "avatar">) => void;
  updateStaff: (id: string, changes: Partial<StaffProfile>) => void;
  deleteStaff: (id: string) => void;
  findStaffByName: (name: string) => StaffProfile | undefined;
};

const StaffContext = createContext<StaffContextType | null>(null);

export function StaffProvider({
  children,
  seedFromUsers,
  seedFromArticles,
  seedFromColumnists,
}: {
  children: ReactNode;
  seedFromUsers: AdminUser[];
  seedFromArticles: Article[];
  seedFromColumnists: { name: string; role?: string; bio?: string }[];
}) {
  const seedByName = new Map<string, StaffProfile>();

  for (const u of seedFromUsers) {
    const entry = withDefaults(
      {
        id: `S-${u.id}`,
        name: u.name,
        profileTitle: u.profileTitle,
        quote: u.quote,
        bio: u.bio,
        badgeLabel: u.badgeLabel,
        avatar: u.avatar,
        updatedAt: u.updatedAt,
      },
      u.role,
    );
    seedByName.set(u.name.trim().toLowerCase(), entry);
  }

  // Add any byline-only authors (no admin account) so Staff stays in sync.
  for (const a of seedFromArticles) {
    const name = a.author?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seedByName.has(key)) continue;
    seedByName.set(
      key,
      withDefaults({
        id: `S-byline-${authorSlug(name)}`,
        name,
      }),
    );
  }

  // Add opinion columnists (public-facing, may have no bylines/admin access)
  for (const c of seedFromColumnists) {
    const name = c.name?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seedByName.has(key)) continue;
    seedByName.set(
      key,
      withDefaults({
        id: `S-col-${authorSlug(name)}`,
        name,
        profileTitle: c.role,
        bio: c.bio,
      }),
    );
  }

  const seed = Array.from(seedByName.values());

  const [staff, setStaff] = useState<StaffProfile[]>(seed);
  const hydrated = useRef(false);

  useEffect(() => {
    setStaff(loadStaff(seed));
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    saveStaff(staff);
  }, [staff]);

  function addStaff(entry: Omit<StaffProfile, "id" | "updatedAt" | "avatar">) {
    const id = `S${Date.now()}`;
    const enriched = withDefaults({ ...entry, id });
    setStaff((prev) => [enriched, ...prev]);
  }

  function updateStaff(id: string, changes: Partial<StaffProfile>) {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === id
          ? withDefaults(
              {
                ...s,
                ...changes,
                name: changes.name ?? s.name,
                avatar: changes.name ? authorInitials(changes.name) : s.avatar,
                updatedAt: Date.now(),
              },
              undefined,
            )
          : s,
      ),
    );
  }

  function deleteStaff(id: string) {
    setStaff((prev) => prev.filter((s) => s.id !== id));
  }

  function findStaffByName(name: string) {
    const target = name.trim().toLowerCase();
    return staff.find((s) => s.name.trim().toLowerCase() === target);
  }

  return (
    <StaffContext.Provider
      value={{ staff, addStaff, updateStaff, deleteStaff, findStaffByName }}
    >
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  const ctx = useContext(StaffContext);
  if (!ctx) throw new Error("useStaff must be used inside StaffProvider");
  return ctx;
}

