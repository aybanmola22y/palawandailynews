import { Suspense } from "react";
import AdminArticles from "@/screens/admin/articles";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading articles…</div>}>
      <AdminArticles />
    </Suspense>
  );
}
