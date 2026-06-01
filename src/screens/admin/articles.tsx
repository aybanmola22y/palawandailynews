"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useArticles, ArticleStatus } from "@/store/articles-context";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { Search, ExternalLink } from "lucide-react";
import { formatAdminDateTime } from "@/lib/admin-utils";
import { paginateArticles } from "@/lib/site-articles";

const STATUS_STYLES: Record<ArticleStatus, string> = {
  Published: "bg-[#E5F6ED] text-[#008A45] dark:bg-[#008A45]/20 dark:text-[#E5F6ED]",
  Draft: "bg-[#F5F5F3] text-[#666] dark:bg-[#333] dark:text-[#AAA]",
  Review: "bg-[#FFF8E1] text-[#B45309] dark:bg-[#B45309]/20 dark:text-[#FFF8E1]",
};

const STATUSES: ArticleStatus[] = ["Published", "Draft", "Review"];

export default function AdminArticles() {
  const { articles, deleteArticle } = useArticles();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 25;

  useEffect(() => {
    const status = searchParams.get("status");
    if (status && STATUSES.includes(status as ArticleStatus)) {
      setStatusFilter(status);
    }
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    const published = articles.filter((a) => a.status === "Published").length;
    const drafts = articles.filter((a) => a.status === "Draft").length;
    const review = articles.filter((a) => a.status === "Review").length;
    const breaking = articles.filter((a) => a.isBreaking).length;
    return { published, drafts, review, breaking };
  }, [articles]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    articles.forEach((a) => {
      const cat = a.category || "Uncategorized";
      map[cat] = (map[cat] ?? 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [articles]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return articles.filter((a) => {
      const matchSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "All Statuses" || a.status === statusFilter;
      const matchCategory =
        categoryFilter === "All Categories" || a.category === categoryFilter;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [articles, search, statusFilter, categoryFilter]);

  const { items: pageItems, totalPages } = useMemo(
    () => paginateArticles(filtered, page, perPage),
    [filtered, page],
  );

  const canPrev = page > 1;
  const canNext = page < totalPages;

  function handleDelete(id: string) {
    deleteArticle(id);
    setDeleteId(null);
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-serif text-[32px] font-bold text-foreground">Articles</h1>
          <p className="text-[14px] text-muted-foreground mt-1 max-w-xl">
            Manage published stories and drafts. Published articles appear on the public site.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/admin/articles/new")}
          className="bg-[#C41E3A] text-white px-4 py-2 text-[12px] font-bold uppercase tracking-widest hover:bg-[#A01830] transition-colors shrink-0"
        >
          New Article
        </button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <AdminStatCard label="Total" value={articles.length} />
        <AdminStatCard
          label="Published"
          value={stats.published}
          accent="success"
          href="/admin/articles?status=Published"
        />
        <AdminStatCard
          label="In review"
          value={stats.review}
          accent="warning"
          href="/admin/articles?status=Review"
        />
        <AdminStatCard
          label="Drafts"
          value={stats.drafts}
          href="/admin/articles?status=Draft"
        />
        <AdminStatCard
          label="Breaking"
          value={stats.breaking}
          accent="primary"
          hint="For future CMS publish"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_240px] gap-6">
        <div className="bg-white dark:bg-[#1A1A18] border border-border flex flex-col min-w-0">
          <div className="p-4 border-b border-border flex flex-wrap items-center gap-3 bg-[#F5F5F3] dark:bg-[#111111]">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search title, author, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#0A0A09] border border-border text-[13px] outline-none focus:border-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-[#0A0A09] border border-border text-[13px] outline-none focus:border-primary"
            >
              <option>All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-[#0A0A09] border border-border text-[13px] outline-none focus:border-primary max-w-[min(100%,280px)]"
            >
              <option value="All Categories">
                All categories ({articles.length})
              </option>
              {categoryCounts.map(([cat, count]) => {
                const pct = articles.length
                  ? Math.round((count / articles.length) * 100)
                  : 0;
                return (
                  <option key={cat} value={cat}>
                    {cat} ({count} · {pct}%)
                  </option>
                );
              })}
            </select>
            <span className="text-[12px] text-muted-foreground sm:ml-auto whitespace-nowrap">
              {filtered.length} of {articles.length}
            </span>
          </div>

          <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3 bg-white dark:bg-[#1A1A18]">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Page <span className="text-foreground font-semibold">{page}</span> of{" "}
              <span className="text-foreground font-semibold">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] border border-border rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={!canNext}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] border border-border rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors"
              >
                Next
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#FAFAF8] dark:bg-[#111111] border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-bold uppercase tracking-widest text-[11px] text-muted-foreground w-[88px]">
                    Image
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-widest text-[11px] text-muted-foreground">
                    Story
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-widest text-[11px] text-muted-foreground">
                    Author
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-widest text-[11px] text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-widest text-[11px] text-muted-foreground text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No articles match your filters.
                    </td>
                  </tr>
                )}
                {pageItems.map((article) => (
                  <tr
                    key={article.id}
                    className="hover:bg-[#FAFAF8] dark:hover:bg-[#111111] transition-colors"
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col items-center gap-2.5 w-[72px]">
                        {article.isBreaking ? (
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[#C41E3A] leading-none text-center w-full">
                            Breaking
                          </span>
                        ) : (
                          <span
                            className="text-[9px] leading-none invisible text-center w-full"
                            aria-hidden
                          >
                            Breaking
                          </span>
                        )}
                        <div className="w-[72px] h-[54px] bg-muted border border-border overflow-hidden shrink-0">
                          {article.image ? (
                            <img
                              src={article.image}
                              alt=""
                              className="w-full h-full object-contain bg-background"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] text-muted-foreground uppercase">
                              No img
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 min-w-[220px] max-w-[360px]">
                      <div className="min-w-0">
                          <p className="font-serif text-[15px] font-medium text-foreground line-clamp-2">
                            {article.title}
                          </p>
                          <p className="text-[12px] text-muted-foreground line-clamp-1 mt-1">
                            {article.excerpt || "No excerpt"}
                          </p>
                          {article.tags?.length ? (
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2 line-clamp-1">
                              {article.tags.slice(0, 6).join(" · ")}
                            </p>
                          ) : null}
                          <div className="grid grid-cols-[6.75rem_6.75rem_3.25rem] gap-x-3 mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                            <span className="text-primary font-semibold truncate">
                              {article.category || "—"}
                            </span>
                            <span className="tabular-nums text-foreground/85 whitespace-nowrap pr-2">
                              {formatAdminDateTime(article.date)}
                            </span>
                            <span className="tabular-nums whitespace-nowrap pl-2 border-l border-border/60">
                              {article.readingTime || "—"}
                            </span>
                          </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {article.author || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${STATUS_STYLES[article.status] ?? STATUS_STYLES.Draft}`}
                      >
                        {article.status || "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end items-center flex-wrap">
                        {article.status === "Published" && (
                          <Link
                            href={`/article/${article.id}`}
                            target="_blank"
                            className="text-[11px] font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider inline-flex items-center gap-1"
                          >
                            View
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/admin/articles/${article.id}/edit`)
                          }
                          className="text-[11px] font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(article.id)}
                          className="text-[11px] font-medium text-muted-foreground hover:text-[#C41E3A] uppercase tracking-wider"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-6 xl:self-start">
          <div className="bg-white dark:bg-[#1A1A18] border border-border p-5">
            <h2 className="text-[12px] font-bold uppercase tracking-widest mb-4">
              Publishing pipeline
            </h2>
            <ul className="space-y-3 text-[13px]">
              <li className="flex justify-between items-center">
                <span className="text-muted-foreground">Published (live)</span>
                <span className="font-serif text-xl font-bold">{stats.published}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-muted-foreground">Awaiting review</span>
                <span className="font-serif text-xl font-bold">{stats.review}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-muted-foreground">Drafts</span>
                <span className="font-serif text-xl font-bold">{stats.drafts}</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#FAFAF8] dark:bg-[#111111] border border-border p-5">
            <h2 className="text-[12px] font-bold uppercase tracking-widest mb-2">
              Quick tip
            </h2>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Use <strong className="text-foreground">Breaking News</strong> in the
              editor to pin a story on the homepage hero. Only one breaking flag
              is recommended at a time.
            </p>
          </div>
        </aside>
      </div>

      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="bg-white dark:bg-[#1A1A18] border border-border w-full max-w-sm p-8 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-[20px] font-bold">Delete Article?</h3>
            <p className="text-[14px] text-muted-foreground leading-relaxed">
              This permanently removes the article from the site.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-5 py-2 text-[12px] font-bold uppercase tracking-widest border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteId)}
                className="px-5 py-2 text-[12px] font-bold uppercase tracking-widest bg-[#C41E3A] text-white hover:bg-[#A01830] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
