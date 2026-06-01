"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AdminAuthUser } from "@/lib/admin-auth";

export type { AdminAuthUser };

type AdminAuthContextValue = {
  user: AdminAuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/session", { credentials: "include" });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = (await res.json()) as { user: AdminAuthUser };
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setUser(null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });

    return () => subscription.unsubscribe();
  }, [refresh]);

  const value = useMemo(
    () => ({ user, loading, refresh, logout }),
    [user, loading, refresh, logout],
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return ctx;
}
