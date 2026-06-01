"use client";

import { usePathname } from "next/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminAuthProvider } from "@/store/admin-auth-context";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <AdminAuthProvider>
      <AdminLayout>{children}</AdminLayout>
    </AdminAuthProvider>
  );
}
