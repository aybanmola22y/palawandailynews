"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { users as seedUsers } from "@/data/users";
import { defaultAuthorProfile } from "@/lib/author-profile-defaults";

export type UserRole = "Super Admin" | "Editor" | "Writer" | "Moderator";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastActive: string;
  avatar: string;
  updatedAt: number;
  /** Shown on the public author page under the name */
  profileTitle: string;
  /** Italic pull quote on author page */
  quote: string;
  /** Long bio paragraph on author page */
  bio: string;
  /** Label under avatar initials (e.g. Palawan) */
  badgeLabel: string;
}

const STORAGE_KEY = "pdn_users";
const STORAGE_VERSION = "v2";
const VERSION_KEY = "pdn_users_version";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function withProfileDefaults(
  user: Omit<AdminUser, "updatedAt" | "profileTitle" | "quote" | "bio" | "badgeLabel" | "avatar"> &
    Partial<Pick<AdminUser, "profileTitle" | "quote" | "bio" | "badgeLabel" | "avatar" | "updatedAt">>,
): AdminUser {
  const profile = defaultAuthorProfile(user.name, user.role);
  return {
    ...user,
    profileTitle: user.profileTitle ?? profile.profileTitle,
    quote: user.quote ?? profile.quote,
    bio: user.bio ?? profile.bio,
    badgeLabel: user.badgeLabel ?? profile.badgeLabel,
    avatar: user.avatar ?? initials(user.name),
    updatedAt: user.updatedAt ?? Date.now(),
  };
}

const seedProfiles: Record<string, Partial<AdminUser>> = {
  "Elena Rosal": {
    profileTitle: "Staff Reporter & Investigative Journalist",
    quote:
      "Passionate about uncovering stories that matter and giving voice to communities across Palawan and the MIMAROPA region.",
    bio: "Elena Rosal is a senior journalist with Palawan Daily News, covering environment, governance, and community affairs across the archipelago. With years of experience in investigative reporting, Elena brings depth, context, and accountability to the stories that shape island communities.",
    badgeLabel: "Palawan",
  },
  "Miguel Santos": {
    profileTitle: "Senior Editor & Features Writer",
    quote:
      "Every story deserves careful editing and a clear voice — especially when it serves the people of Palawan.",
    bio: "Miguel Santos leads editorial workflow at Palawan Daily News, shaping daily coverage and long-form features. He works closely with reporters to ensure accuracy, clarity, and impact in every published piece.",
    badgeLabel: "Palawan",
  },
  "Maria Clara": {
    profileTitle: "Staff Reporter",
    quote:
      "Local stories connect us to the places we live — I focus on the people behind the headlines.",
    bio: "Maria Clara reports on lifestyle, culture, and community news for Palawan Daily News. Her work highlights everyday stories that reflect how Palawan lives, works, and celebrates.",
    badgeLabel: "Palawan",
  },
};

const seedAdminUsers: AdminUser[] = seedUsers.map((u) =>
  withProfileDefaults({
    ...u,
    role: u.role as UserRole,
    ...seedProfiles[u.name],
  }),
);

function loadUsers(): AdminUser[] {
  try {
    const version = localStorage.getItem(VERSION_KEY);
    const stored = localStorage.getItem(STORAGE_KEY);

    if (version !== STORAGE_VERSION) {
      localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
      if (stored) {
        const parsed = JSON.parse(stored) as AdminUser[];
        return parsed.map((u) =>
          withProfileDefaults({
            ...u,
            ...seedProfiles[u.name],
          }),
        );
      }
      return seedAdminUsers;
    }

    if (stored) {
      const parsed = JSON.parse(stored) as AdminUser[];
      return parsed.map((u) => withProfileDefaults(u));
    }
  } catch {
    /* ignore */
  }
  return seedAdminUsers;
}

function saveUsers(users: AdminUser[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch {
    /* ignore */
  }
}

function touchActive() {
  return "Just now";
}

interface UsersContextType {
  users: AdminUser[];
  addUser: (
    user: Omit<
      AdminUser,
      "id" | "avatar" | "lastActive" | "updatedAt" | "profileTitle" | "quote" | "bio" | "badgeLabel"
    > &
      Partial<Pick<AdminUser, "profileTitle" | "quote" | "bio" | "badgeLabel">>,
  ) => void;
  updateUser: (id: string, changes: Partial<AdminUser>) => void;
  deleteUser: (id: string) => boolean;
}

const UsersContext = createContext<UsersContextType | null>(null);

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AdminUser[]>(seedAdminUsers);
  const hydrated = useRef(false);

  useEffect(() => {
    setUsers(loadUsers());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    saveUsers(users);
  }, [users]);

  function addUser(
    user: Omit<
      AdminUser,
      "id" | "avatar" | "lastActive" | "updatedAt" | "profileTitle" | "quote" | "bio" | "badgeLabel"
    > &
      Partial<Pick<AdminUser, "profileTitle" | "quote" | "bio" | "badgeLabel">>,
  ) {
    const entry = withProfileDefaults({
      ...user,
      id: `U${Date.now()}`,
      lastActive: touchActive(),
    });
    setUsers((prev) => [...prev, entry]);
  }

  function updateUser(id: string, changes: Partial<AdminUser>) {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const name = changes.name ?? u.name;
        const role = changes.role ?? u.role;
        return withProfileDefaults({
          ...u,
          ...changes,
          name,
          role,
          avatar: changes.name ? initials(name) : u.avatar,
          lastActive: touchActive(),
          updatedAt: Date.now(),
        });
      }),
    );
  }

  function deleteUser(id: string) {
    const target = users.find((u) => u.id === id);
    if (!target) return false;
    const superAdmins = users.filter((u) => u.role === "Super Admin");
    if (target.role === "Super Admin" && superAdmins.length <= 1) {
      return false;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    return true;
  }

  return (
    <UsersContext.Provider value={{ users, addUser, updateUser, deleteUser }}>
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsers must be used inside UsersProvider");
  return ctx;
}
