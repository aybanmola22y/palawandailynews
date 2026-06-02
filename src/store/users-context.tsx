"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  createAdminUser,
  fetchAdminUsers,
  patchAdminUser,
  removeAdminUser,
  type CreateAdminUserInput,
} from "@/lib/admin-users-api";

export type UserRole = "Super Admin" | "Editor" | "Writer" | "Moderator";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastActive: string;
  avatar: string;
  updatedAt: number;
  /** Linked Supabase Auth user id (when synced). */
  authUserId?: string;
  /** Shown on the public author page under the name */
  profileTitle: string;
  /** Italic pull quote on author page */
  quote: string;
  /** Long bio paragraph on author page */
  bio: string;
  /** Label under avatar initials (e.g. Palawan) */
  badgeLabel: string;
}

interface UsersContextType {
  users: AdminUser[];
  loading: boolean;
  error: string | null;
  refreshUsers: () => Promise<void>;
  addUser: (user: CreateAdminUserInput) => Promise<void>;
  updateUser: (
    id: string,
    changes: Partial<Pick<AdminUser, "name" | "email" | "role">>,
  ) => Promise<void>;
  deleteUser: (id: string) => Promise<boolean>;
}

const UsersContext = createContext<UsersContextType | null>(null);

export function UsersProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedAdminRef = useRef(false);

  const refreshUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAdminUsers();
      setUsers(list);
      loadedAdminRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!pathname?.startsWith("/admin")) return;
    if (pathname === "/admin/login") return;
    void refreshUsers();
  }, [pathname, refreshUsers]);

  async function addUser(user: CreateAdminUserInput) {
    const created = await createAdminUser(user);
    setUsers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async function updateUser(
    id: string,
    changes: Partial<Pick<AdminUser, "name" | "email" | "role">>,
  ) {
    const updated = await patchAdminUser(id, changes);
    setUsers((prev) =>
      prev
        .map((u) => (u.id === id ? { ...u, ...updated } : u))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  }

  async function deleteUser(id: string) {
    const target = users.find((u) => u.id === id);
    if (!target) return false;
    const superAdmins = users.filter((u) => u.role === "Super Admin");
    if (target.role === "Super Admin" && superAdmins.length <= 1) {
      return false;
    }
    await removeAdminUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    return true;
  }

  return (
    <UsersContext.Provider
      value={{
        users,
        loading,
        error,
        refreshUsers,
        addUser,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsers must be used inside UsersProvider");
  return ctx;
}
