import { NextRequest, NextResponse } from "next/server";
import { requireAdminRouteAuth } from "@/lib/admin-route-auth";
import { fetchPublishedSummaries } from "@/lib/articles/fetch-published-summaries";
import { PUBLIC_SUMMARIES_BOOTSTRAP_LIMIT } from "@/lib/articles/load-public-summaries";

function parseLimitParam(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.min(n, 500);
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminRouteAuth();
  if (auth instanceof NextResponse) return auth;

  const limit = parseLimitParam(request.nextUrl.searchParams.get("limit"));

  try {
    const articles = await fetchPublishedSummaries(auth.service, {
      publishedOnly: false,
      includeTags: true,
      limit,
    });

    return NextResponse.json(articles);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load articles";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
