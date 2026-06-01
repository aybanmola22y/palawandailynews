import { Suspense } from "react";
import AuthorProfile from "@/screens/author-profile";

function AuthorProfileFallback() {
  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <div className="editorial-container">
        <div className="mb-8 h-10 w-64 animate-pulse rounded-sm bg-muted" />
        <div className="h-5 w-full max-w-lg animate-pulse rounded-sm bg-muted/80" />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<AuthorProfileFallback />}>
      <AuthorProfile />
    </Suspense>
  );
}
