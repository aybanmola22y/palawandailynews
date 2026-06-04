"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { parseTagsFromInput } from "@/lib/article-tags";
import { cn } from "@/lib/utils";

type ArticleTagsInputProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
};

export function ArticleTagsInput({ tags, onChange }: ArticleTagsInputProps) {
  const [draft, setDraft] = useState(() => tags.join(", "));

  function applyDraft(value: string) {
    setDraft(value);
    onChange(parseTagsFromInput(value));
  }

  function removeTag(tag: string) {
    const next = tags.filter((t) => t !== tag);
    onChange(next);
    setDraft(next.join(", "));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;

    const parsed = parseTagsFromInput(trimmed);
    if (!parsed.length) return;

    const next = [...new Set([...tags, ...parsed])].slice(0, 30);
    onChange(next);
    setDraft("");
  }

  const pillClass =
    "inline-flex items-center gap-1 rounded-full border border-border bg-background pl-3 pr-1.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground";

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
        Tags
      </label>
      <input
        value={draft}
        onChange={(e) => applyDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="comma, separated, tags — or press Enter"
        className="input"
      />
      <p className="text-[11px] text-muted-foreground leading-snug">
        Add multiple tags with commas (e.g.{" "}
        <span className="font-medium text-foreground">palawan, tourism, news</span>
        ) or press Enter after each tag.
      </p>
      {tags.length > 0 ? (
        <ul className="mt-1 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li key={tag}>
              <span className={pillClass}>
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className={cn(
                    "rounded-full p-0.5 text-muted-foreground transition-colors",
                    "hover:bg-muted hover:text-foreground",
                  )}
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
