import { Suspense } from "react";
import AdminSecurity from "@/screens/admin/security";

function SecurityFallback() {
  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <header className="border-b border-border pb-6">
        <p className="text-sm text-muted-foreground">Loading security settings…</p>
      </header>
    </div>
  );
}

export default function AdminSecurityPage() {
  return (
    <Suspense fallback={<SecurityFallback />}>
      <AdminSecurity />
    </Suspense>
  );
}
