import type { Metadata } from "next";
import ArticleDetail from "@/screens/article";
import { buildArticleMetadata } from "@/lib/articles/article-metadata";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  return buildArticleMetadata(id);
}

export default function Page() {
  return <ArticleDetail />;
}
