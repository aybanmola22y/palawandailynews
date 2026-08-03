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
import type { PublicStaffProfile } from "@/lib/staff/fetch-staff-profiles";

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
const STAFF_API_CACHE_KEY = "pdn_staff_api_cache";
/** Names explicitly removed in admin — do not resurrect from seeds. */
const REMOVED_SEED_NAMES_KEY = "pdn_staff_removed_seed_names_v1";
const STAFF_CACHE_TTL_MS = 2 * 60 * 60 * 1000;

function readRemovedSeedNames(): Set<string> {
  try {
    const raw = localStorage.getItem(REMOVED_SEED_NAMES_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed
        .map((n) => String(n ?? "").trim().toLowerCase())
        .filter(Boolean),
    );
  } catch {
    return new Set();
  }
}

function writeRemovedSeedNames(names: Set<string>) {
  try {
    localStorage.setItem(
      REMOVED_SEED_NAMES_KEY,
      JSON.stringify([...names].sort()),
    );
  } catch {
    /* ignore */
  }
}

function rememberRemovedSeedName(name: string) {
  const key = name.trim().toLowerCase();
  if (!key) return;
  const next = readRemovedSeedNames();
  next.add(key);
  writeRemovedSeedNames(next);
}

function forgetRemovedSeedName(name: string) {
  const key = name.trim().toLowerCase();
  if (!key) return;
  const next = readRemovedSeedNames();
  if (!next.delete(key)) return;
  writeRemovedSeedNames(next);
}

/** One-time: stop resurrecting the old hardcoded demo columnists. */
function purgeLegacyDummyColumnists() {
  try {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("pdn_purged_dummy_columnists_v1") === "1") return;
    const next = readRemovedSeedNames();
    next.add("dr. antonio bautista");
    next.add("atty. victoria lim");
    writeRemovedSeedNames(next);
    localStorage.setItem("pdn_purged_dummy_columnists_v1", "1");
  } catch {
    /* ignore */
  }
}

/** Platform operators — CMS-only, never public staff. */
const PLATFORM_OPERATOR_NAMES = new Set([
  "john aivanne molato",
  "joseph baria",
]);

/** One-time: keep John/Joseph off the public staff roster. */
function purgePlatformOperatorsFromStaff() {
  try {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("pdn_purged_platform_operators_from_staff_v1") === "1") {
      return;
    }
    const next = readRemovedSeedNames();
    for (const name of PLATFORM_OPERATOR_NAMES) next.add(name);
    writeRemovedSeedNames(next);
    localStorage.setItem("pdn_purged_platform_operators_from_staff_v1", "1");
  } catch {
    /* ignore */
  }
}

function isPlatformOperatorName(name: string): boolean {
  return PLATFORM_OPERATOR_NAMES.has(name.trim().toLowerCase());
}

function withoutPlatformOperators(list: StaffProfile[]): StaffProfile[] {
  return list.filter((s) => !isPlatformOperatorName(s.name));
}

function isPersistedStaffId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id.trim(),
  );
}

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
  const removed = readRemovedSeedNames();

  for (const s of stored) byName.set(s.name.trim().toLowerCase(), s);

  for (const seedEntry of seed) {
    const key = seedEntry.name.trim().toLowerCase();
    if (removed.has(key)) {
      byName.delete(key);
      continue;
    }
    const existing = byName.get(key);
    merged.push(existing ? { ...seedEntry, ...existing } : seedEntry);
    byName.delete(key);
  }

  // Append extra stored staff not in seed
  for (const extra of byName.values()) {
    if (removed.has(extra.name.trim().toLowerCase())) continue;
    merged.push(extra);
  }

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

type StaffApiCache = {
  savedAt: number;
  staff: PublicStaffProfile[];
};

function readStaffApiCache(): StaffProfile[] | null {
  try {
    const raw = localStorage.getItem(STAFF_API_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StaffApiCache;
    if (!parsed?.staff?.length) return null;
    if (Date.now() - parsed.savedAt >= STAFF_CACHE_TTL_MS) return null;
    return parsed.staff;
  } catch {
    return null;
  }
}

function writeStaffApiCache(staff: StaffProfile[]) {
  try {
    const payload: StaffApiCache = {
      savedAt: Date.now(),
      staff,
    };
    localStorage.setItem(STAFF_API_CACHE_KEY, JSON.stringify(payload));
    saveStaff(staff);
  } catch {
    /* ignore */
  }
}

async function loadStaffFromApi(): Promise<StaffProfile[] | null> {
  const res = await fetch("/api/staff-profiles", { credentials: "same-origin" });
  if (!res.ok) return null;
  const data = (await res.json()) as PublicStaffProfile[];
  if (!Array.isArray(data) || !data.length) return null;
  return data;
}

type StaffContextType = {
  staff: StaffProfile[];
  addStaff: (entry: Omit<StaffProfile, "id" | "updatedAt" | "avatar">) => Promise<void>;
  updateStaff: (id: string, changes: Partial<StaffProfile>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
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

  // Editorial staff from Admin Users — except platform operators (John / Joseph).
  for (const u of seedFromUsers) {
    if (isPlatformOperatorName(u.name)) continue;
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
    if (isPlatformOperatorName(name) || seedByName.has(key)) continue;
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
    if (isPlatformOperatorName(name) || seedByName.has(key)) continue;
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

  // `seed` is a freshly-built array every render, so using it directly in a
  // `useEffect` dependency can cause infinite update loops.
  // We instead depend on a stable signature derived from the seed contents.
  const seedKey = seed
    .map((s) => ({
      name: s.name.trim().toLowerCase(),
      id: s.id,
      profileTitle: s.profileTitle,
      badgeLabel: s.badgeLabel,
      // quote/bio can be long; include the full strings to avoid collisions.
      quote: s.quote,
      bio: s.bio,
      avatar: s.avatar,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const seedKeyStr = JSON.stringify(seedKey);

  const [staff, setStaff] = useState<StaffProfile[]>(() => {
    purgeLegacyDummyColumnists();
    purgePlatformOperatorsFromStaff();
    return withoutPlatformOperators(mergeWithSeed([], seed));
  });
  const hydrated = useRef(false);

  useEffect(() => {
    let cancelled = false;
    purgeLegacyDummyColumnists();
    purgePlatformOperatorsFromStaff();

    async function run() {
      const cached = readStaffApiCache();
      if (cached?.length && !cancelled) {
        setStaff(withoutPlatformOperators(mergeWithSeed(cached, seed)));
      }

      try {
        const remote = await loadStaffFromApi();
        if (cancelled) return;

        if (!remote?.length) {
          setStaff(withoutPlatformOperators(loadStaff(seed)));
        } else {
          const merged = withoutPlatformOperators(mergeWithSeed(remote, seed));
          setStaff(merged);
          writeStaffApiCache(merged);
        }
        hydrated.current = true;
      } catch {
        if (cancelled) return;
        if (!cached?.length) {
          setStaff(withoutPlatformOperators(loadStaff(seed)));
        }
        hydrated.current = true;
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
    // Intentionally run once; seed changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When Admin Users / bylines load after first paint, merge them into Staff
  // without resurrecting removed seeds or platform operators.
  useEffect(() => {
    if (!hydrated.current) return;
    setStaff((prev) => withoutPlatformOperators(mergeWithSeed(prev, seed)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKeyStr]);

  async function addStaff(
    entry: Omit<StaffProfile, "id" | "updatedAt" | "avatar">,
  ) {
    const tempId = `temp-${Date.now()}`;
    const optimistic = withDefaults({ ...entry, id: tempId, updatedAt: Date.now() });
    setStaff((prev) => [optimistic, ...prev]);

    const res = await fetch("/api/admin/staff-profiles", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });

    if (!res.ok) {
      setStaff((prev) => prev.filter((s) => s.id !== tempId));
      const text = await res.text().catch(() => "");
      throw new Error(text || "Failed to add staff profile");
    }

    const saved = (await res.json()) as StaffProfile;
    forgetRemovedSeedName(saved.name);
    setStaff((prev) => {
      const next = prev.map((s) => (s.id === tempId ? saved : s));
      writeStaffApiCache(next);
      return next;
    });
  }

  async function updateStaff(id: string, changes: Partial<StaffProfile>) {
    const existing = staff.find((s) => s.id === id);
    if (!existing) return;

    const payload = {
      name: (changes.name ?? existing.name).trim(),
      profileTitle: changes.profileTitle ?? existing.profileTitle,
      quote: changes.quote ?? existing.quote,
      bio: changes.bio ?? existing.bio,
      badgeLabel: changes.badgeLabel ?? existing.badgeLabel,
    };

    const previous = staff;
    setStaff((prev) =>
      prev.map((s) =>
        s.id === id
          ? withDefaults(
              {
                ...s,
                ...payload,
                name: payload.name,
                avatar: authorInitials(payload.name),
                updatedAt: Date.now(),
              },
              undefined,
            )
          : s,
      ),
    );

    const res = await fetch(`/api/admin/staff-profiles/${encodeURIComponent(id)}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setStaff(previous);
      const text = await res.text().catch(() => "");
      throw new Error(text || "Failed to update staff profile");
    }

    const saved = (await res.json()) as StaffProfile;
    setStaff((prev) => {
      const next = prev.map((s) => (s.id === id ? saved : s));
      writeStaffApiCache(next);
      return next;
    });
  }

  async function deleteStaff(id: string) {
    const previous = staff;
    const member = previous.find((s) => s.id === id);
    const next = previous.filter((s) => s.id !== id);
    setStaff(next);

    if (member?.name) {
      rememberRemovedSeedName(member.name);
    }

    // Seed-only rows (S-col-… / S-byline-…) are not Supabase UUIDs — remove locally.
    if (!isPersistedStaffId(id)) {
      writeStaffApiCache(next);
      return;
    }

    const res = await fetch(`/api/admin/staff-profiles/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      if (member?.name) forgetRemovedSeedName(member.name);
      setStaff(previous);
      const text = await res.text().catch(() => "");
      throw new Error(text || "Failed to delete staff profile");
    }

    writeStaffApiCache(next);
  }

  // Keep John / Joseph off Staff even if they appear in cache or bylines.
  const visibleStaff = withoutPlatformOperators(staff);

  function findStaffByName(name: string) {
    const target = name.trim().toLowerCase();
    return visibleStaff.find((s) => s.name.trim().toLowerCase() === target);
  }

  return (
    <StaffContext.Provider
      value={{ staff: visibleStaff, addStaff, updateStaff, deleteStaff, findStaffByName }}
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

