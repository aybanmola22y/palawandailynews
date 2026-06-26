import { NextRequest, NextResponse } from "next/server";
import { requireAdminRouteAuth } from "@/lib/admin-route-auth";
import { fetchPublishedSummaries } from "@/lib/articles/fetch-published-summaries";

const ADMIN_BOOTSTRAP_LIMIT = 500;

function parseLimitParam(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.min(n, ADMIN_BOOTSTRAP_LIMIT);
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminRouteAuth();
  if (auth instanceof NextResponse) return auth;

  const wantFull = request.nextUrl.searchParams.get("full") === "1";
  const parsedLimit = parseLimitParam(request.nextUrl.searchParams.get("limit"));
  const limit = wantFull ? undefined : (parsedLimit ?? ADMIN_BOOTSTRAP_LIMIT);

  try {
    const articles = await fetchPublishedSummaries(auth.service, {
      publishedOnly: false,
      selectMode: "admin",
      limit,
    });

    return NextResponse.json(articles);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load articles";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
