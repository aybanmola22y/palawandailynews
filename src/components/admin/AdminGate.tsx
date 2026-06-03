"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "sileo";
import "sileo/styles.css";
import "@/styles/sileo-admin.css";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminAuthProvider } from "@/store/admin-auth-context";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  return (
    <>
      <Toaster position="top-center" />
      {isLogin ? (
        children
      ) : (
        <AdminAuthProvider>
          <AdminLayout>{children}</AdminLayout>
        </AdminAuthProvider>
      )}
    </>
  );
}
