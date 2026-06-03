import { NextResponse } from "next/server";
import { requireAdminRouteAuth } from "@/lib/admin-route-auth";
import {
  ADMIN_ARTICLE_SUMMARY_SELECT,
} from "@/lib/articles/fetch-published-summaries";
import { rowToArticle } from "@/lib/articles/map-article-row";
import { excerptToPlainText } from "@/lib/html-editor-content";
import { sortByDateDesc } from "@/lib/site-articles";
import type { ArticleRow } from "@/lib/supabase/database.types";
import type { Article } from "@/types/article";

function summaryFromRow(row: ArticleRow) {
  const article = rowToArticle({
    ...row,
    excerpt: excerptToPlainText(row.excerpt ?? "").slice(0, 280),
    content: "",
  });
  return article;
}

function aggregateTopTags(rows: { tags: string[] | null }[], limit: number) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const tag of row.tags ?? []) {
      const key = tag.trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

export async function GET() {
  const auth = await requireAdminRouteAuth();
  if (auth instanceof NextResponse) return auth;

  const client = auth.service;

  const [publishedRes, reviewRes, totalRes] = await Promise.all([
    client
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("status", "Published"),
    client
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("status", "Review"),
    client.from("articles").select("id", { count: "exact", head: true }),
  ]);

  const draftRes = await client
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("status", "Draft")
    .eq("cms_origin", true);

  const draftCount = draftRes.error?.message?.includes("cms_origin")
    ? 0
    : (draftRes.count ?? 0);

  const countError =
    publishedRes.error ??
    (draftRes.error?.message?.includes("cms_origin") ? null : draftRes.error) ??
    reviewRes.error ??
    totalRes.error;
  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const [recentRes, latestRes, tagSampleRes] = await Promise.all([
    client
      .from("articles")
      .select(ADMIN_ARTICLE_SUMMARY_SELECT)
      .eq("status", "Published")
      .order("date", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(6),
    client
      .from("articles")
      .select(ADMIN_ARTICLE_SUMMARY_SELECT)
      .order("date", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(6),
    client
      .from("articles")
      .select("tags")
      .order("updated_at", { ascending: false })
      .limit(800),
  ]);

  const listError = recentRes.error ?? latestRes.error;
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const topTags = tagSampleRes.error
    ? []
    : aggregateTopTags(
        (tagSampleRes.data ?? []) as { tags: string[] | null }[],
        8,
      );

  return NextResponse.json({
    counts: {
      published: publishedRes.count ?? 0,
      drafts: draftCount,
      review: reviewRes.count ?? 0,
      total: totalRes.count ?? 0,
    },
    recentPublished: sortByDateDesc(
      (recentRes.data ?? []).map((row) =>
        summaryFromRow(row as ArticleRow),
      ) as Article[],
    ).slice(0, 6),
    latestByDate: sortByDateDesc(
      (latestRes.data ?? []).map((row) =>
        summaryFromRow(row as ArticleRow),
      ) as Article[],
    ).slice(0, 6),
    topTags,
  });
}
