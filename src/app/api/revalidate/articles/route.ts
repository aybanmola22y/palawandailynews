import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_SUMMARIES_BOOTSTRAP_LIMIT } from "@/lib/articles/load-public-summaries";

/**
 * On-demand cache bust for the public article list.
 * Called from CMS publishes (including localhost → production).
 *
 * Auth: Authorization: Bearer <REVALIDATE_SECRET>
 *    or  x-revalidate-secret: <REVALIDATE_SECRET>
 */
export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: "REVALIDATE_SECRET is not configured." },
      { status: 503 },
    );
  }

  const bearer = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-revalidate-secret")?.trim();
  const token = headerSecret || bearer?.replace(/^Bearer\s+/i, "").trim();

  if (!token || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag("article-summaries");
  revalidateTag("article-opinion");
  revalidatePath("/api/articles/summaries");
  revalidatePath(
    `/api/articles/summaries?limit=${PUBLIC_SUMMARIES_BOOTSTRAP_LIMIT}`,
  );
  revalidatePath("/api/articles/opinion");
  revalidatePath("/");
  revalidatePath("/latest");
  revalidatePath("/opinion");

  return NextResponse.json({
    revalidated: true,
    at: new Date().toISOString(),
  });
}
