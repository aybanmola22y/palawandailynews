import { NextRequest, NextResponse } from "next/server";
import { articleToRow, rowToArticle } from "@/lib/articles/map-article-row";
import { requireAdminRouteAuth } from "@/lib/admin-route-auth";
import type { ArticleInsert } from "@/types/article";
import { revalidatePublicArticleSummaries } from "@/lib/articles/revalidate-public-summaries";
import {
  slugifyArticleId,
  validateArticleForPersist,
} from "@/lib/articles/article-persist";

export async function POST(request: NextRequest) {
  const auth = await requireAdminRouteAuth();
  if (auth instanceof NextResponse) return auth;

  let body: ArticleInsert;
  try {
    body = (await request.json()) as ArticleInsert;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validationError = validateArticleForPersist(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const id = body.id?.trim() || slugifyArticleId(body.title);
  const row = articleToRow({
    ...body,
    id,
    tags: body.tags ?? [],
    updatedAt: Date.now(),
  });

  const { service } = auth;
  let { data, error } = await service.from("articles").insert(row as never).select().single();

  if (
    error &&
    typeof error.message === "string" &&
    error.message.toLowerCase().includes("duplicate")
  ) {
    const retryId = `${id}-${Date.now()}`;
    ({ data, error } = await service
      .from("articles")
      .insert({ ...row, id: retryId } as never)
      .select()
      .single());
  }

  if (
    error &&
    typeof error.message === "string" &&
    error.message.includes('column "tags"')
  ) {
    const { tags: _tags, ...rowWithoutTags } = row as Record<string, unknown>;
    ({ data, error } = await service
      .from("articles")
      .insert(rowWithoutTags as never)
      .select()
      .single());
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }

  revalidatePublicArticleSummaries();
  return NextResponse.json(rowToArticle(data));
}
