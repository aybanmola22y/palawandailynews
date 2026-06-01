import { Suspense } from "react";
import Search from "@/screens/search";

function SearchFallback() {
  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <div className="editorial-container">
        <div className="mb-6 h-9 w-32 animate-pulse rounded-sm bg-muted" />
        <div className="mb-2 h-5 w-full max-w-md animate-pulse rounded-sm bg-muted/80" />
        <div className="mb-14 h-14 w-full animate-pulse rounded-sm bg-muted/60" />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <Search />
    </Suspense>
  );
}
