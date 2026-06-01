import { Suspense } from "react";
import AdminLogin from "@/screens/admin/login";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F5F5F3] text-muted-foreground text-sm">
          Loading…
        </div>
      }
    >
      <AdminLogin />
    </Suspense>
  );
}
