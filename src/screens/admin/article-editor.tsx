"use client";

import { useState, useEffect, useRef, DragEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useArticles, Article, ArticleStatus } from "@/store/articles-context";
import {
  renderContent,
  prepareArticleBody,
  resolveDisplayExcerpt,
} from "@/lib/render-content";
import { ArticleDetailHeader } from "@/components/editorial/ArticleDetailHeader";
import { formatArticleDate } from "@/lib/site-articles";
import Link from "next/link";
import { ArrowLeft, Save, Send, Upload, Link as LinkIcon, X, Image, Eye, Pencil } from "lucide-react";

const CATEGORIES = ["Environment", "Business", "Documentary", "Lifestyle", "Politics", "Opinion", "Legal"];
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

export default function ArticleEditor() {
  const { articles, addArticle, updateArticle } = useArticles();
  const params = useParams<{ id?: string }>();
  const router = useRouter();

  const isEdit = !!params.id;
  const existing = isEdit ? articles.find(a => a.id === params.id) : undefined;

  const [form, setForm] = useState<Omit<Article, "id">>(() =>
    existing ? { ...existing } : emptyForm()
  );
  const [saved, setSaved] = useState(false);
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write");

  // Hero image state
  const [imageTab, setImageTab] = useState<"upload" | "url">("upload");
  const [dragging, setDragging] = useState(false);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  // Inline image insert state
  const [showImageInsert, setShowImageInsert] = useState(false);
  const [inlineImageTab, setInlineImageTab] = useState<"upload" | "url">("upload");
  const [inlineImageUrl, setInlineImageUrl] = useState("");
  const [inlineImageAlt, setInlineImageAlt] = useState("");
  const [inlineDragging, setInlineDragging] = useState(false);
  const inlineFileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const imageInsertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (existing) {
      setForm({ ...existing });
    } else {
      setForm((prev) => ({
        ...prev,
        date:
          prev.date ||
          new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          }),
      }));
    }
  }, [params.id, existing]);

  // Close image insert popup on outside click
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
    reader.onload = (e) => setForm(prev => ({ ...prev, image: e.target?.result as string }));
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
    const textarea = contentRef.current;
    const tag = `\n\n![${inlineImageAlt}](${inlineImageUrl})\n\n`;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = form.content.slice(0, start) + tag + form.content.slice(end);
      setForm(prev => ({ ...prev, content: newContent }));
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + tag.length;
        textarea.focus();
      }, 0);
    } else {
      setForm(prev => ({ ...prev, content: prev.content + tag }));
    }
    setShowImageInsert(false);
    setInlineImageUrl("");
    setInlineImageAlt("");
  }

  function handleSave(status: ArticleStatus) {
    const updated = { ...form, status };
    if (isEdit && params.id) {
      updateArticle(params.id, updated);
    } else {
      addArticle(updated);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.push("/admin/articles");
  }

  const chars = form.content.length;
  const words = wordCount(form.content);

  return (
    <div className="flex flex-col h-[calc(100vh)] -m-8 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-border bg-white dark:bg-[#1A1A18] shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/articles")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[13px]">Articles</span>
          </button>
          <div className="w-px h-5 bg-border" />
          <div>
            <h1 className="font-serif text-[20px] font-bold leading-tight">
              {isEdit ? "Edit Article" : "New Article"}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              CMS workspace only — live site reads from WordPress
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saved && <span className="text-[12px] text-[#008A45] font-medium">Saved!</span>}
          <button
            onClick={() => handleSave("Draft")}
            className="flex items-center gap-2 px-4 py-2 border border-border text-[12px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Save Draft
          </button>
          <button
            onClick={() => handleSave("Published")}
            disabled={!form.title.trim() || !form.author.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-[#C41E3A] text-white text-[12px] font-bold uppercase tracking-wider hover:bg-[#A01830] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            {isEdit ? "Update" : "Save"}
          </button>
        </div>
      </div>

      {/* Body — single scroll area (no separate sidebar scrollbar) */}
      <div className="flex flex-1 min-h-0 overflow-y-auto">
        {/* Left — editor / preview */}
        <div className="flex-1 min-w-0 px-8 py-8 flex flex-col gap-6">

          {/* Title */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Article Title</label>
            <textarea
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Enter an engaging title..."
              rows={2}
              className="w-full text-[32px] font-serif font-bold leading-tight bg-transparent border-b-2 border-border focus:border-foreground outline-none resize-none text-foreground placeholder:text-muted-foreground/40 pb-3 transition-colors"
            />
          </div>

          {/* Excerpt */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Excerpt <span className="normal-case tracking-normal font-normal text-muted-foreground/60">— short summary shown in listings</span>
            </label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              placeholder="Write a short summary for article listings and previews..."
              rows={2}
              className="w-full text-[15px] leading-relaxed bg-[#F7F7F5] dark:bg-[#111111] border border-border focus:border-foreground outline-none resize-none text-foreground placeholder:text-muted-foreground/40 px-4 py-3 transition-colors"
            />
          </div>

          {/* Content */}
          <div className="flex flex-col gap-2 flex-1">
            {/* Content toolbar */}
            <div className="flex items-center justify-between">
              {/* Write / Preview tabs */}
              <div className="flex border border-border">
                <button
                  onClick={() => setEditorMode("write")}
                  className={`flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    editorMode === "write" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Pencil className="w-3 h-3" /> Write
                </button>
                <button
                  onClick={() => setEditorMode("preview")}
                  className={`flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider border-l border-border transition-colors ${
                    editorMode === "preview" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Eye className="w-3 h-3" /> Preview
                </button>
              </div>

              {editorMode === "write" && (
                <div className="flex items-center gap-3">
                  {/* Insert image button */}
                  <div className="relative" ref={imageInsertRef}>
                    <button
                      onClick={() => setShowImageInsert(v => !v)}
                      className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 transition-colors"
                    >
                      <Image className="w-3 h-3" /> Insert Image
                    </button>

                    {/* Insert image popup */}
                    {showImageInsert && (
                      <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#1A1A18] border border-border shadow-lg z-20 p-4 flex flex-col gap-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Insert Image into Content</p>

                        {/* Tab switcher */}
                        <div className="flex border border-border">
                          <button
                            onClick={() => setInlineImageTab("upload")}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                              inlineImageTab === "upload" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Upload className="w-3 h-3" /> Upload
                          </button>
                          <button
                            onClick={() => setInlineImageTab("url")}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold uppercase tracking-wider border-l border-border transition-colors ${
                              inlineImageTab === "url" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <LinkIcon className="w-3 h-3" /> URL
                          </button>
                        </div>

                        {/* Upload */}
                        {inlineImageTab === "upload" && (
                          <>
                            <input ref={inlineFileInputRef} type="file" accept="image/*" className="hidden" onChange={onInlineFileChange} />
                            <div
                              onClick={() => inlineFileInputRef.current?.click()}
                              onDragOver={(e) => { e.preventDefault(); setInlineDragging(true); }}
                              onDragLeave={() => setInlineDragging(false)}
                              onDrop={onInlineDrop}
                              className={`flex flex-col items-center justify-center gap-2 py-5 border-2 border-dashed cursor-pointer transition-colors text-center ${
                                inlineDragging ? "border-[#C41E3A] bg-[#C41E3A]/5" : "border-border hover:border-foreground hover:bg-muted/30"
                              }`}
                            >
                              {inlineImageUrl && inlineImageUrl.startsWith("data:") ? (
                                <img src={inlineImageUrl} alt="preview" className="h-20 object-contain" />
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-[11px] text-muted-foreground">Click or drag an image here</span>
                                </>
                              )}
                            </div>
                          </>
                        )}

                        {/* URL */}
                        {inlineImageTab === "url" && (
                          <input
                            value={inlineImageUrl.startsWith("data:") ? "" : inlineImageUrl}
                            onChange={(e) => setInlineImageUrl(e.target.value)}
                            placeholder="https://..."
                            className="input text-[12px]"
                          />
                        )}

                        {/* Alt text */}
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
                </div>
              )}
            </div>

            {/* Write mode */}
            {editorMode === "write" && (
              <>
                <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-[#FAFAF8] dark:bg-[#111111] border border-border">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                    Formatting guide
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-background border border-border">
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
                        Section title
                      </span>
                      <code className="font-mono text-[13px] font-semibold text-foreground">
                        ## Heading
                      </code>
                    </span>
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-background border border-border">
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
                        Pull quote
                      </span>
                      <code className="font-mono text-[13px] font-semibold text-foreground">
                        &gt; Quote
                      </code>
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                      Add a blank line between paragraphs
                    </span>
                  </div>
                </div>
                <textarea
                  ref={contentRef}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder={`Start writing your article here...\n\nUse ## to create section headings.\nUse > to create a pull quote.\nUse the Insert Image button to embed photos.\n\nSeparate paragraphs with a blank line.`}
                  className="w-full flex-1 min-h-[420px] text-[16px] leading-[1.8] bg-white dark:bg-[#0F0F0E] border border-border focus:border-foreground outline-none resize-none text-foreground placeholder:text-muted-foreground/30 px-5 py-4 font-sans transition-colors"
                />
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span>{chars} characters</span>
                  <span>{words} words</span>
                </div>
              </>
            )}

            {/* Preview mode */}
            {editorMode === "preview" && (
              <div className="border border-border bg-background min-h-[420px] overflow-y-auto">
                <div className="max-w-[720px] mx-auto px-8 py-10">
                  <ArticleDetailHeader
                    category={form.category || undefined}
                    title={form.title || "No title yet"}
                    excerpt={resolveDisplayExcerpt(
                      form.excerpt?.trim() || undefined,
                      form.content,
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
                        form.content,
                        form.excerpt?.trim() || undefined,
                      ),
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — settings sidebar */}
        <aside className="w-[300px] shrink-0 self-start border-l border-border bg-[#FAFAF8] dark:bg-[#111111] px-6 py-6 flex flex-col gap-6">

          {/* Publish Settings */}
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Publish Settings</h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ArticleStatus })}
                  className="input"
                >
                  <option value="" disabled>Select status</option>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
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

          <div className="border-t border-border" />

          {/* Metadata */}
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Metadata</h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input"
                >
                  <option value="" disabled>Select category</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Author</label>
                <input
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  placeholder="Full name"
                  className="input"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  Tags
                </label>
                <input
                  value={(form.tags ?? []).join(", ")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tags: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="e.g. wildlife, conservation, puerto princesa"
                  className="input"
                />
                <p className="text-[11px] text-muted-foreground">
                  Comma-separated. Used for search and filtering.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Date</label>
                <input
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  placeholder="Oct 12, 2026"
                  className="input"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Reading Time</label>
                <input
                  value={form.readingTime}
                  onChange={(e) => setForm({ ...form, readingTime: e.target.value })}
                  placeholder="5 min"
                  className="input"
                />
              </div>
            </div>
          </section>

          <div className="border-t border-border" />

          {/* Hero Image */}
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Hero Image</h2>
            <div className="flex flex-col gap-3">
              {form.image ? (
                <div className="relative aspect-[16/9] overflow-hidden bg-muted group">
                  <img
                    src={form.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <button
                    onClick={() => setForm({ ...form, image: "" })}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="aspect-[16/9] bg-[#EFEFED] dark:bg-[#1A1A18] border border-dashed border-border flex items-center justify-center">
                  <span className="text-[12px] text-muted-foreground">No image set</span>
                </div>
              )}

              <div className="flex border border-border">
                <button
                  onClick={() => setImageTab("upload")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    imageTab === "upload" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Upload className="w-3 h-3" /> Upload
                </button>
                <button
                  onClick={() => setImageTab("url")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold uppercase tracking-wider border-l border-border transition-colors ${
                    imageTab === "url" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LinkIcon className="w-3 h-3" /> URL
                </button>
              </div>

              {imageTab === "upload" && (
                <>
                  <input ref={heroFileInputRef} type="file" accept="image/*" className="hidden" onChange={onHeroFileChange} />
                  <div
                    onClick={() => heroFileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onHeroDrop}
                    className={`flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed cursor-pointer transition-colors ${
                      dragging ? "border-[#C41E3A] bg-[#C41E3A]/5" : "border-border hover:border-foreground hover:bg-muted/40"
                    }`}
                  >
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[12px] text-muted-foreground text-center leading-relaxed">
                      Click to choose a file<br />
                      <span className="text-[11px]">or drag and drop here</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">PNG, JPG, WEBP</span>
                  </div>
                </>
              )}

              {imageTab === "url" && (
                <input
                  value={form.image.startsWith("data:") ? "" : form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://... or /images/hero-1.svg"
                  className="input text-[12px]"
                />
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
