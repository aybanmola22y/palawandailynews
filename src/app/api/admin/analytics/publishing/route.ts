import { NextRequest, NextResponse } from "next/server";
import { requireAdminRouteAuth } from "@/lib/admin-route-auth";
import { clampInt } from "@/lib/security/safe-url";

function ymd(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function labelFromYmd(value: string) {
  // value is YYYY-MM-DD
  const d = new Date(`${value}T00:00:00.000Z`);
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminRouteAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const days = clampInt(searchParams.get("days"), 7, 120, 30);

  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  start.setUTCHours(0, 0, 0, 0);

  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const { data, error } = await auth.service
    .from("articles")
    .select("date")
    .eq("status", "Published")
    .gte("date", startIso)
    .lte("date", endIso)
    // keep payload small; counts per day don't need more
    .limit(100_000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const key = row?.date ? ymd(row.date) : null;
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const series: { date: string; label: string; published: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    series.push({
      date: key,
      label: labelFromYmd(key),
      published: counts.get(key) ?? 0,
    });
  }

  return NextResponse.json({
    range: { start: startIso, end: endIso, days },
    series,
  });
}

