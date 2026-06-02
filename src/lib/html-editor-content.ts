/** Detect stored article body that uses HTML tags (e.g. WordPress imports). */
export function looksLikeHtml(content: string): boolean {
  if (!content?.trim()) return false;
  const decoded = decodeStoredHtml(content);
  if (/<\/?[a-z][\s\S]*?>/i.test(decoded)) return true;
  if (/&lt;\/?[a-z][\s\S]*?&gt;/i.test(content)) return true;
  if (/<\s*\/?\s*p\b/i.test(decoded)) return true;
  if (decoded.includes("</p>") || decoded.includes("<p>")) return true;
  return false;
}

/** Turn any stored article body into HTML for the visual admin editor. */
export function contentToVisualEditorHtml(content: string): string {
  const raw = content?.trim() ?? "";
  if (!raw) return "";
  const decoded = decodeStoredHtml(raw);
  if (looksLikeHtml(decoded)) return normalizeImportedHtml(decoded);
  return plainToArticleHtml(decoded);
}

/** Plain-text excerpt for a simple summary field (no tags). */
export function excerptToPlainText(excerpt: string): string {
  if (!excerpt?.trim()) return "";
  if (looksLikeHtml(excerpt)) return htmlToEditorPlain(excerpt);
  return excerpt.replace(/<[^>]+>/g, "").trim();
}

/** Decode entity-encoded HTML so tags can be edited visually. */
export function decodeStoredHtml(content: string): string {
  if (!/&lt;\/?[a-z]/i.test(content)) return content;
  return content
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

/** Normalize imported HTML for the visual editor (paragraphs, no stray tags in text nodes). */
export function normalizeImportedHtml(html: string): string {
  const decoded = decodeStoredHtml(html).replace(/\r\n/g, "\n").trim();
  if (!decoded) return "";

  let s = decoded;

  s = s.replace(
    /<\/(p|div|h[1-6]|li|blockquote|section|article)>\s*<(p|div|h[1-6]|li|blockquote|section|article)(\s[^>]*)?>/gi,
    "</$1>\n<$2$3>",
  );
  s = s.replace(/<br\s*\/?>/gi, "<br />");

  if (!/<\/?[a-z]/i.test(s)) {
    const paragraphs = s.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    if (paragraphs.length <= 1) return `<p>${escapeHtmlText(s.trim())}</p>`;
    return paragraphs.map((p) => `<p>${escapeHtmlText(p)}</p>`).join("\n");
  }

  return s;
}

/** Plain text from HTML (fallback when not using the visual editor). */
export function contentToEditorPlain(content: string): string {
  if (!content?.trim()) return "";
  const html = decodeStoredHtml(content);
  if (looksLikeHtml(html)) return htmlToEditorPlain(html);
  return content;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeHtmlAttr(text: string): string {
  return escapeHtmlText(text).replace(/'/g, "&#39;");
}

/**
 * Convert stored HTML into plain text for the write-mode textarea.
 * Paragraphs are separated by a blank line; line breaks inside a paragraph stay as single newlines.
 */
export function htmlToEditorPlain(html: string): string {
  if (!html?.trim()) return "";

  let s = decodeStoredHtml(html).replace(/\r\n/g, "\n");

  s = s.replace(
    /<img[^>]*\s+alt=["']([^"']*)["'][^>]*\s+src=["']([^"']+)["'][^>]*\/?>/gi,
    "\n\n![$1]($2)\n\n",
  );
  s = s.replace(
    /<img[^>]*\s+src=["']([^"']+)["'][^>]*\s+alt=["']([^"']*)["'][^>]*\/?>/gi,
    "\n\n![$2]($1)\n\n",
  );
  s = s.replace(/<img[^>]*\s+src=["']([^"']+)["'][^>]*\/?>/gi, "\n\n![]($1)\n\n");

  s = s.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, inner) => {
    const title = stripHtmlTags(inner).trim();
    return title ? `\n\n## ${title}\n\n` : "\n\n";
  });

  s = s.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner) => {
    const quote = stripHtmlTags(inner).replace(/\s+/g, " ").trim();
    return quote ? `\n\n> ${quote}\n\n` : "\n\n";
  });

  s = s.replace(
    /<\/(p|div|h[1-6]|li|blockquote|section|article)>\s*<(p|div|h[1-6]|li|blockquote|section|article)[^>]*>/gi,
    "\n\n",
  );
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/(p|div|h[1-6]|li|blockquote|section|article)>/gi, "\n\n");
  s = s.replace(/<(p|div|h[1-6]|li|blockquote|section|article)[^>]*>/gi, "");

  s = stripHtmlTags(s);
  s = decodeHtmlEntities(s);

  const paragraphs = s
    .split(/\n{2,}/)
    .map((p) => p.replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n").trim())
    .filter(Boolean);

  return paragraphs.join("\n\n");
}

/**
 * Convert write-mode plain text back to HTML for storage and the public site.
 */
export function plainToArticleHtml(plain: string): string {
  const trimmed = plain.trim();
  if (!trimmed) return "";

  const blocks = trimmed.split(/\n{2,}/);
  const parts: string[] = [];

  for (const block of blocks) {
    const text = block.trim();
    if (!text) continue;

    const imageMatch = text.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      const alt = escapeHtmlAttr(imageMatch[1]);
      const src = escapeHtmlAttr(imageMatch[2]);
      parts.push(`<p><img src="${src}" alt="${alt}" /></p>`);
      continue;
    }

    if (text.startsWith("## ")) {
      parts.push(`<h2>${escapeHtmlText(text.slice(3).trim())}</h2>`);
      continue;
    }

    if (text.startsWith("> ")) {
      const quote = text
        .split("\n")
        .map((line) => line.replace(/^>\s?/, "").trim())
        .filter(Boolean)
        .join(" ");
      parts.push(`<blockquote><p>${escapeHtmlText(quote)}</p></blockquote>`);
      continue;
    }

    const inner = escapeHtmlText(text).replace(/\n/g, "<br />");
    parts.push(`<p>${inner}</p>`);
  }

  return parts.join("\n");
}

/** Body string used for preview and public render helpers. */
export function editorPlainToStoredBody(
  editorPlain: string,
  format: "html" | "markdown",
): string {
  return format === "html" ? plainToArticleHtml(editorPlain) : editorPlain;
}
