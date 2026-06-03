"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { normalizeImportedHtml } from "@/lib/html-editor-content";

export type HtmlBodyEditorHandle = {
  focus: () => void;
  insertHtml: (snippet: string) => void;
  getHtml: () => string;
};

type HtmlBodyEditorProps = {
  /** Changes only when a different article (or server body) is loaded — not on every keystroke. */
  seedKey: string;
  initialHtml: string;
  loading?: boolean;
  onChange: (html: string) => void;
  isEmpty?: boolean;
  placeholder?: string;
};

export const HtmlBodyEditor = forwardRef<HtmlBodyEditorHandle, HtmlBodyEditorProps>(
  function HtmlBodyEditor(
    {
      seedKey,
      initialHtml,
      loading,
      onChange,
      isEmpty = false,
      placeholder = "Click here and start writing…",
    },
    ref,
  ) {
    const editorRef = useRef<HTMLDivElement>(null);
    const loadedSeedRef = useRef<string | null>(null);

    useImperativeHandle(ref, () => ({
      focus: () => editorRef.current?.focus(),
      insertHtml: (snippet: string) => {
        const el = editorRef.current;
        if (!el) return;
        el.focus();
        document.execCommand("insertHTML", false, snippet);
        onChange(el.innerHTML);
      },
      getHtml: () => editorRef.current?.innerHTML ?? "",
    }));

    useEffect(() => {
      const el = editorRef.current;
      if (!el || loading || !seedKey) return;
      if (loadedSeedRef.current === seedKey) return;

      const normalized = normalizeImportedHtml(initialHtml);
      el.innerHTML = normalized || "";
      loadedSeedRef.current = seedKey;
    }, [seedKey, initialHtml, loading]);

    function handleInput() {
      const el = editorRef.current;
      if (!el) return;
      onChange(el.innerHTML);
    }

    return (
      <div className="relative min-h-[420px] border border-border bg-white dark:bg-[#0F0F0E] focus-within:border-foreground transition-colors">
        {isEmpty && (
          <p className="pointer-events-none absolute left-5 top-4 text-[16px] text-muted-foreground/30">
            {placeholder}
          </p>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline
          onInput={handleInput}
          className="html-body-editor min-h-[420px] px-5 py-4 text-[16px] leading-[1.85] text-foreground outline-none"
        />
      </div>
    );
  },
);
