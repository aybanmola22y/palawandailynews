import { NextRequest, NextResponse } from "next/server";
import { articleToRow, rowToArticle } from "@/lib/articles/map-article-row";
import { requireAdminRouteAuth } from "@/lib/admin-route-auth";
import type { ArticleUpdate } from "@/types/article";
import type { ArticleUpdateRow } from "@/lib/supabase/database.types";
import { resolveImageUrl } from "@/lib/articles/map-article-row";
import { revalidatePublicArticleSummaries } from "@/lib/articles/revalidate-public-summaries";

type RouteParams = { params: Promise<{ id: string }> };

function buildPatch(changes: ArticleUpdate): ArticleUpdateRow {
  const patch: ArticleUpdateRow = { updated_at: new Date().toISOString() };

  if (changes.title !== undefined) patch.title = changes.title;
  if (changes.excerpt !== undefined) patch.excerpt = changes.excerpt;
  if (changes.content !== undefined) patch.content = changes.content;
  if (changes.category !== undefined) patch.category = changes.category;
  if (changes.author !== undefined) patch.author = changes.author;
  if (changes.tags !== undefined) patch.tags = changes.tags;
  if (changes.date !== undefined) patch.date = changes.date;
  if (changes.readingTime !== undefined) patch.reading_time = changes.readingTime;
  if (changes.image !== undefined) patch.image_url = resolveImageUrl(changes.image);
  if (changes.isBreaking !== undefined) patch.is_breaking = changes.isBreaking;
  if (changes.status !== undefined) patch.status = changes.status;
  if (changes.legacyWpId !== undefined) patch.legacy_wp_id = changes.legacyWpId ?? null;

  return patch;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminRouteAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const { data, error } = await auth.service
    .from("articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  return NextResponse.json(rowToArticle(data));
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminRouteAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  let changes: ArticleUpdate;
  try {
    changes = (await request.json()) as ArticleUpdate;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patch = buildPatch(changes);
  const { service } = auth;

  let { data, error } = await service
    .from("articles")
    .update(patch as never)
    .eq("id", id)
    .select()
    .single();

  if (
    error &&
    typeof error.message === "string" &&
    error.message.includes('column "tags"')
  ) {
    const { tags: _tags, ...patchWithoutTags } = patch as Record<string, unknown>;
    ({ data, error } = await service
      .from("articles")
      .update(patchWithoutTags as never)
      .eq("id", id)
      .select()
      .single());
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  revalidatePublicArticleSummaries();
  return NextResponse.json(rowToArticle(data));
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminRouteAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const { error } = await auth.service.from("articles").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePublicArticleSummaries();
  return new NextResponse(null, { status: 204 });
}
