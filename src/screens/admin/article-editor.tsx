"use client";

import { useState, useEffect, useRef, useMemo, DragEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useArticles, Article, ArticleStatus } from "@/store/articles-context";
import {
  renderContent,
  prepareArticleBody,
  resolveDisplayExcerpt,
} from "@/lib/render-content";
import {
  contentToVisualEditorHtml,
  excerptToPlainText,
  normalizeImportedHtml,
  plainToArticleHtml,
} from "@/lib/html-editor-content";
import {
  HtmlBodyEditor,
  type HtmlBodyEditorHandle,
} from "@/components/admin/HtmlBodyEditor";
import { ArticleDetailHeader } from "@/components/editorial/ArticleDetailHeader";
import { formatArticleDate } from "@/lib/site-articles";
import {
  getArticleCategoryOptions,
  resolveCategoryForSelect,
} from "@/lib/article-categories";
import { validateArticleForPersist } from "@/lib/articles/article-persist";
import Link from "next/link";
import { ArrowLeft, Save, Send, Upload, Link as LinkIcon, X, Image, Eye, Pencil } from "lucide-react";

const STATUSES: ArticleStatus[] = ["Published", "Draft", "Review"];

const emptyForm = (): Omit<Article, "id"> => ({
  title: "",
  excerpt: "",
  content: "",
  category: "",
  author: "",
  tags: [],
  date: "",
  readingTime: "",
  image: "",
  isBreaking: false,
  status: "" as ArticleStatus,
});

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function plainTextFromHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default function ArticleEditor() {
  const {
    articles,
    loading,
    error,
    addArticle,
    updateArticle,
    ensureArticleContent,
    refreshArticles,
  } = useArticles();
  const params = useParams<{ id?: string }>();
  const router = useRouter();

  const isEdit = !!params.id;
  const articleId = params.id ?? "";
  const existing = isEdit
    ? articles.find((a) => a.id.toLowerCase() === articleId.toLowerCase())
    : undefined;

  const [form, setForm] = useState<Omit<Article, "id">>(emptyForm);
  const [bodyHtml, setBodyHtml] = useState("");
  const [htmlEditorSeedKey, setHtmlEditorSeedKey] = useState("new");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [cmsWritable, setCmsWritable] = useState<boolean | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write");

  const [imageTab, setImageTab] = useState<"upload" | "url">("upload");
  const [dragging, setDragging] = useState(false);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  const [showImageInsert, setShowImageInsert] = useState(false);
  const [inlineImageTab, setInlineImageTab] = useState<"upload" | "url">("upload");
  const [inlineImageUrl, setInlineImageUrl] = useState("");
  const [inlineImageAlt, setInlineImageAlt] = useState("");
  const [inlineDragging, setInlineDragging] = useState(false);
  const inlineFileInputRef = useRef<HTMLInputElement>(null);
  const htmlEditorRef = useRef<HtmlBodyEditorHandle>(null);
  const imageInsertRef = useRef<HTMLDivElement>(null);
  const loadedArticleKeyRef = useRef<string | null>(null);

  const categoryOptions = useMemo(
    () =>
      getArticleCategoryOptions(
        articles,
        form.category || existing?.category,
      ),
    [articles, form.category, existing?.category],
  );

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/cms-status", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { canWriteArticles?: boolean } | null) => {
        if (!cancelled && data) setCmsWritable(Boolean(data.canWriteArticles));
      })
      .catch(() => {
        if (!cancelled) setCmsWritable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isEdit || !articleId) return;

    let cancelled = false;
    setLoadingArticle(true);

    void (async () => {
      await ensureArticleContent(articleId);
      if (!cancelled) setLoadingArticle(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isEdit, articleId, ensureArticleContent]);

  useEffect(() => {
    loadedArticleKeyRef.current = null;
    setBodyHtml("");
    setHtmlEditorSeedKey(isEdit ? "" : "new");
  }, [articleId, isEdit]);

  useEffect(() => {
    if (!isEdit) {
      setForm((prev) => ({
        ...emptyForm(),
        ...prev,
        date:
          prev.date ||
          new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          }),
      }));
      setHtmlEditorSeedKey("new");
      return;
    }

    if (!existing) return;

    const sourceContent = existing.content ?? "";
    const loadKey = `${existing.id}::${sourceContent}`;
    if (loadedArticleKeyRef.current === loadKey) return;

    const visualHtml = contentToVisualEditorHtml(sourceContent);
    setBodyHtml(visualHtml);
    setHtmlEditorSeedKey(loadKey);
    setForm({
      ...existing,
      category: resolveCategoryForSelect(
        existing.category ?? "",
        getArticleCategoryOptions(articles, existing.category),
      ),
      content: "",
      excerpt: excerptToPlainText(existing.excerpt ?? ""),
    });
    loadedArticleKeyRef.current = loadKey;
  }, [existing, isEdit, existing?.content, articles]);

  useEffect(() => {
    if (!showImageInsert) return;
    function handleClick(e: MouseEvent) {
      if (imageInsertRef.current && !imageInsertRef.current.contains(e.target as Node)) {
        setShowImageInsert(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showImageInsert]);

  function handleHeroFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setForm((prev) => ({ ...prev, image: e.target?.result as string }));
    reader.readAsDataURL(file);
  }

  function onHeroFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleHeroFile(file);
  }

  function onHeroDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleHeroFile(file);
  }

  function handleInlineFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setInlineImageUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function onInlineFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleInlineFile(file);
  }

  function onInlineDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setInlineDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleInlineFile(file);
  }

  function insertImageAtCursor() {
    if (!inlineImageUrl.trim()) return;
    const alt = inlineImageAlt.replace(/"/g, "&quot;");
    const src = inlineImageUrl.replace(/"/g, "&quot;");
    htmlEditorRef.current?.insertHtml(`<p><img src="${src}" alt="${alt}" /></p>`);
    setShowImageInsert(false);
    setInlineImageUrl("");
    setInlineImageAlt("");
  }

  function bodyForPreviewAndSave(): string {
    const live = htmlEditorRef.current?.getHtml();
    return normalizeImportedHtml(live || bodyHtml);
  }

  async function handleSave(status: ArticleStatus) {
    setSaveError(null);

    const updated = {
      ...form,
      status,
      content: bodyForPreviewAndSave(),
      excerpt: form.excerpt.trim(),
    };

    const validationError = validateArticleForPersist(updated);
    if (validationError) {
      setSaveError(validationError);
      return;
    }

    if (cmsWritable === false) {
      setSaveError(
        "Cannot save: add SUPABASE_SERVICE_ROLE_KEY to .env and restart npm run dev.",
      );
      return;
    }

    setSaving(true);
    try {
      if (isEdit && articleId) {
        await updateArticle(articleId, updated);
      } else {
        const saved = await addArticle(updated);
        if (!saved?.id) {
          throw new Error("Article was not saved to Supabase.");
        }
      }
      await refreshArticles();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.push("/admin/articles");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save article");
    } finally {
      setSaving(false);
    }
  }

  const statsSource = plainTextFromHtml(bodyHtml);
  const chars = statsSource.length;
  const words = wordCount(statsSource);

  const editorLoading = isEdit && (loadingArticle || !htmlEditorSeedKey);

  if (isEdit && !loading && !existing && !loadingArticle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8">
        <p className="text-muted-foreground text-sm">Article not found.</p>
        <Link
          href="/admin/articles"
          className="text-[12px] font-bold uppercase tracking-widest text-primary hover:underline"
        >
          Back to articles
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh)] -m-8 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-border bg-white dark:bg-[#1A1A18] shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/articles")}
            className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Articles
          </button>
          <div className="w-px h-6 bg-border" />
          <div>
            <h1 className="text-[18px] font-serif font-bold text-foreground">
              {isEdit ? "Edit Article" : "New Article"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveError && (
            <p className="text-[12px] text-destructive max-w-[280px] text-right">{saveError}</p>
          )}
          {saved && (
            <span className="text-[12px] font-bold text-green-600 uppercase tracking-wider">
              Saved!
            </span>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave("Draft")}
            className="flex items-center gap-2 px-5 py-2.5 border border-border text-[11px] font-bold uppercase tracking-widest hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            Save Draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(form.status || "Published")}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#C41E3A] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#A01830] transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {isEdit ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      {error && (
        <div className="px-8 py-2 bg-destructive/10 text-destructive text-sm shrink-0">{error}</div>
      )}

      {cmsWritable === false && (
        <div className="px-8 py-2 bg-destructive/10 text-destructive text-sm shrink-0">
          Supabase writes are disabled: set <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
          in <code className="text-xs">.env</code> and restart the dev server. Articles will not persist
          until this is configured.
        </div>
      )}

      {saving && (
        <div className="px-8 py-2 bg-muted text-muted-foreground text-sm shrink-0">
          Saving to Supabase…
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Article Title
            </label>
            <textarea
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Enter an engaging title..."
              rows={2}
              className="w-full text-[32px] font-serif font-bold leading-tight bg-transparent border-b-2 border-border focus:border-foreground outline-none resize-none text-foreground placeholder:text-muted-foreground/40 pb-3 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Excerpt{" "}
              <span className="normal-case tracking-normal font-normal text-muted-foreground/60">
                — short summary shown in listings
              </span>
            </label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              placeholder="Write a short summary for article listings and previews..."
              rows={2}
              className="w-full text-[15px] leading-relaxed bg-[#F7F7F5] dark:bg-[#111111] border border-border focus:border-foreground outline-none resize-none text-foreground placeholder:text-muted-foreground/40 px-4 py-3 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-[#F0F0EE] dark:bg-[#1A1A18] p-1 border border-border">
                <button
                  onClick={() => setEditorMode("write")}
                  className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    editorMode === "write"
                      ? "bg-white dark:bg-[#0F0F0E] text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Write
                </button>
                <button
                  onClick={() => setEditorMode("preview")}
                  className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    editorMode === "preview"
                      ? "bg-white dark:bg-[#0F0F0E] text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
              </div>

              {editorMode === "write" && (
                <div className="relative" ref={imageInsertRef}>
                  <button
                    onClick={() => setShowImageInsert(!showImageInsert)}
                    className="flex items-center gap-2 px-4 py-2 border border-border text-[11px] font-bold uppercase tracking-wider hover:bg-muted transition-colors"
                  >
                    <Image className="w-3.5 h-3.5" />
                    Insert Image
                  </button>
                  {showImageInsert && (
                    <div className="absolute right-0 top-full mt-2 w-[320px] bg-white dark:bg-[#1A1A18] border border-border shadow-xl z-50 p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          Insert Image
                        </span>
                        <button onClick={() => setShowImageInsert(false)}>
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                      <div className="flex gap-1 bg-muted p-0.5">
                        <button
                          onClick={() => setInlineImageTab("upload")}
                          className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            inlineImageTab === "upload"
                              ? "bg-white dark:bg-[#0F0F0E] shadow-sm"
                              : "text-muted-foreground"
                          }`}
                        >
                          Upload
                        </button>
                        <button
                          onClick={() => setInlineImageTab("url")}
                          className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            inlineImageTab === "url"
                              ? "bg-white dark:bg-[#0F0F0E] shadow-sm"
                              : "text-muted-foreground"
                          }`}
                        >
                          URL
                        </button>
                      </div>
                      {inlineImageTab === "upload" ? (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setInlineDragging(true);
                          }}
                          onDragLeave={() => setInlineDragging(false)}
                          onDrop={onInlineDrop}
                          onClick={() => inlineFileInputRef.current?.click()}
                          className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                            inlineDragging
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-[11px] text-muted-foreground">
                            Drop image or click to upload
                          </p>
                          <input
                            ref={inlineFileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onInlineFileChange}
                          />
                        </div>
                      ) : (
                        <input
                          value={inlineImageUrl}
                          onChange={(e) => setInlineImageUrl(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="input text-[12px]"
                        />
                      )}
                      <input
                        value={inlineImageAlt}
                        onChange={(e) => setInlineImageAlt(e.target.value)}
                        placeholder="Caption / alt text (optional)"
                        className="input text-[12px]"
                      />
                      <button
                        onClick={insertImageAtCursor}
                        disabled={!inlineImageUrl.trim()}
                        className="w-full py-2 bg-[#C41E3A] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-[#A01830] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Insert into Content
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {editorMode === "write" && (
              <>
                <div className="px-4 py-3 bg-[#FAFAF8] dark:bg-[#111111] border border-border">
                  <p className="text-[13px] text-muted-foreground">
                    Type normally — paragraphs are spaced for you. Press{" "}
                    <kbd className="px-1.5 py-0.5 bg-background border border-border text-[12px] font-mono">
                      Enter
                    </kbd>{" "}
                    to start a new paragraph. Use <strong>Preview</strong> to see how it will look
                    on the site.
                  </p>
                </div>
                {editorLoading ? (
                  <div className="flex flex-1 min-h-[420px] items-center justify-center border border-border bg-white dark:bg-[#0F0F0E] text-[14px] text-muted-foreground">
                    Loading article…
                  </div>
                ) : (
                  <HtmlBodyEditor
                    ref={htmlEditorRef}
                    seedKey={htmlEditorSeedKey}
                    initialHtml={bodyHtml}
                    onChange={setBodyHtml}
                    isEmpty={!bodyHtml.replace(/<[^>]+>/g, "").trim()}
                    placeholder="Click here and start writing your article…"
                  />
                )}
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span>{chars} characters</span>
                  <span>{words} words</span>
                </div>
              </>
            )}

            {editorMode === "preview" && (
              <div className="border border-border bg-background min-h-[420px] overflow-y-auto">
                <div className="max-w-[720px] mx-auto px-8 py-10">
                  <ArticleDetailHeader
                    category={form.category || undefined}
                    title={form.title || "No title yet"}
                    excerpt={resolveDisplayExcerpt(
                      form.excerpt?.trim() ? plainToArticleHtml(form.excerpt.trim()) : undefined,
                      bodyForPreviewAndSave(),
                    )}
                    author={form.author || undefined}
                    date={form.date ? formatArticleDate(form.date) : undefined}
                    readingTime={form.readingTime || undefined}
                    image={form.image || undefined}
                    imageAlt={form.title}
                    statusLabel={
                      form.status && form.status !== "Published" ? form.status : undefined
                    }
                  />
                  <div className="prose prose-neutral dark:prose-invert max-w-none text-[17px] leading-[1.8]">
                    {renderContent(
                      prepareArticleBody(
                        bodyForPreviewAndSave(),
                        form.excerpt?.trim() ? plainToArticleHtml(form.excerpt.trim()) : undefined,
                      ),
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="w-[300px] shrink-0 self-start border-l border-border bg-[#FAFAF8] dark:bg-[#111111] px-6 py-6 flex flex-col gap-6">
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
              Publish Settings
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ArticleStatus })}
                  className="input"
                >
                  <option value="" disabled>
                    Select status
                  </option>
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isBreaking}
                  onChange={(e) => setForm({ ...form, isBreaking: e.target.checked })}
                  className="w-4 h-4 accent-[#C41E3A]"
                />
                <span className="text-[13px] font-medium">Breaking News</span>
              </label>
            </div>
          </section>

          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
              Metadata
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input"
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  Author
                </label>
                <input
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  className="input"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  Tags
                </label>
                <input
                  value={form.tags.join(", ")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tags: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="comma, separated, tags"
                  className="input"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  Date
                </label>
                <input
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="input"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  Reading Time
                </label>
                <input
                  value={form.readingTime}
                  onChange={(e) => setForm({ ...form, readingTime: e.target.value })}
                  placeholder="e.g. 5 min read"
                  className="input"
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
              Hero Image
            </h2>
            {form.image ? (
              <div className="relative group">
                <img
                  src={form.image}
                  alt="Hero"
                  className="w-full aspect-video object-cover border border-border"
                />
                <button
                  onClick={() => setForm({ ...form, image: "" })}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onHeroDrop}
                onClick={() => heroFileInputRef.current?.click()}
                className={`border-2 border-dashed aspect-video flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  dragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Choose Image
                </p>
                <input
                  ref={heroFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onHeroFileChange}
                />
              </div>
            )}
            {!form.image && (
              <div className="mt-3">
                <div className="flex gap-1 bg-muted p-0.5 mb-2">
                  <button
                    onClick={() => setImageTab("upload")}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      imageTab === "upload"
                        ? "bg-white dark:bg-[#0F0F0E] shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    Upload
                  </button>
                  <button
                    onClick={() => setImageTab("url")}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      imageTab === "url"
                        ? "bg-white dark:bg-[#0F0F0E] shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    URL
                  </button>
                </div>
                {imageTab === "url" && (
                  <div className="flex gap-2">
                    <input
                      value={form.image.startsWith("http") ? form.image : ""}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                      placeholder="https://..."
                      className="input text-[12px] flex-1"
                    />
                    <button className="p-2 border border-border hover:bg-muted">
                      <LinkIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
