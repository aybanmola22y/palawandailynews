import { Fragment, type ReactNode } from "react";

function getAdInsertIndex(blockCount: number): number | null {
  if (blockCount < 2) return null;
  if (blockCount < 5) return 1;
  return Math.floor(blockCount / 2);
}

function looksLikeHtml(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

/** Plain text for comparing excerpt vs body (NFKC + HTML entities simplified). */
export function normalizeContentPlainText(text?: string): string {
  if (!text) return "";
  return text
    .normalize("NFKC")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtmlText(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildDedupeIndexMap(text: string) {
  const toOrig: number[] = [];
  let norm = "";

  for (let i = 0; i < text.length; i++) {
    const expanded = text[i].normalize("NFKC");
    for (let j = 0; j < expanded.length; j++) {
      const ch = expanded[j];
      if (/\s/.test(ch)) {
        if (norm.endsWith(" ")) continue;
        norm += " ";
        toOrig.push(i);
      } else {
        norm += ch.toLowerCase();
        toOrig.push(i);
      }
    }
  }

  return { norm: norm.trim(), toOrig };
}

function sliceTextByNormRange(
  text: string,
  toOrig: number[],
  normStart: number,
  normEnd: number,
) {
  if (!toOrig.length || normStart >= toOrig.length) return text;

  const startOrig = toOrig[normStart] ?? 0;
  const endOrig = toOrig[Math.min(Math.max(normEnd - 1, normStart), toOrig.length - 1)] ?? text.length;
  let cutEnd = endOrig + 1;
  while (cutEnd < text.length && /\s/.test(text[cutEnd])) cutEnd += 1;

  const head = text.slice(0, startOrig).trimEnd();
  const tail = text.slice(cutEnd).trimStart();
  if (!head) return tail;
  if (!tail) return head;
  return `${head}\n\n${tail}`;
}

/** Remove a repeated opening block glued inside one paragraph (Facebook / WP imports). */
function stripInlineDuplicateBlocks(text: string): string {
  const { norm, toOrig } = buildDedupeIndexMap(text);
  if (norm.length < 400) return text;

  for (let len = Math.min(420, Math.floor(norm.length * 0.4)); len >= 90; len -= 15) {
    const anchor = norm.slice(0, len);
    const at = norm.indexOf(anchor, len + 20);
    if (at !== -1) {
      return sliceTextByNormRange(text, toOrig, at, at + len);
    }
  }

  const short = norm.slice(0, Math.min(140, norm.length));
  const at2 = norm.indexOf(short, short.length + 30);
  if (at2 !== -1) {
    let k = short.length;
    const maxK = Math.min(norm.length - at2, norm.length, 2500);
    while (k < maxK && norm[at2 + k] === norm[k]) k += 1;
    if (k >= short.length) {
      return sliceTextByNormRange(text, toOrig, at2, at2 + k);
    }
  }

  return text;
}

function processPlainBlockText(inner: string): string {
  const plain = stripHtmlToPlain(inner).normalize("NFKC");
  if (!plain) return "";
  return dedupeSentencesInPlainText(stripInlineDuplicateBlocks(plain));
}

function extractHtmlContentBlocks(html: string): string[] {
  const blocks: string[] = [];
  const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match: RegExpExecArray | null;
  while ((match = pRe.exec(html)) !== null) {
    blocks.push(match[1]);
  }

  const divRe = /<div[^>]*dir=["']auto["'][^>]*>([\s\S]*?)<\/div>/gi;
  while ((match = divRe.exec(html)) !== null) {
    const inner = match[1].trim();
    if (!inner || /<p[\s>]/i.test(inner)) continue;
    blocks.push(inner);
  }

  return blocks;
}

function rebuildCleanArticleHtml(html: string): string {
  const blocks = extractHtmlContentBlocks(html);
  if (blocks.length === 0) {
    const plain = stripHtmlToPlain(html).trim();
    return plain ? dedupePlainBody(plain) : html;
  }

  const processed = blocks
    .map((inner) => processPlainBlockText(inner))
    .filter((t) => t.length > 0);

  const deduped = filterDuplicateParagraphBlocks(processed);
  return deduped.map((t) => `<p>${escapeHtmlText(t)}</p>`).join("\n");
}

/** First paragraph/block of article body as normalized plain text. */
function getLeadingBodyPlainText(content?: string): string {
  if (!content?.trim()) return "";
  if (looksLikeHtml(content)) {
    const blocks = extractHtmlContentBlocks(content);
    if (blocks[0]) return normalizeContentPlainText(blocks[0]);
    return normalizeContentPlainText(content).slice(0, 400);
  }
  const first = content.split(/\n{2,}/).map((b) => b.trim()).find(Boolean) ?? "";
  return normalizeContentPlainText(first);
}

/** Drop back-to-back opening paragraphs that repeat the same text (WP deck lines). */
function stripLeadingConsecutiveDuplicateParagraphs(content: string): string {
  if (!content?.trim()) return content;

  if (looksLikeHtml(content)) {
    let html = content.trim();
    for (let guard = 0; guard < 6; guard++) {
      const m1 = html.match(
        /^(\s*(?:<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>\s*)*)<p[^>]*>([\s\S]*?)<\/p>/i,
      );
      if (!m1) break;
      const rest = html.slice(m1[0].length);
      const m2 = rest.match(
        /^(\s*(?:<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>\s*)*)<p[^>]*>([\s\S]*?)<\/p>/i,
      );
      if (!m2) break;
      const n1 = normalizeContentPlainText(m1[2]);
      const n2 = normalizeContentPlainText(m2[1]);
      if (!paragraphsAreDuplicate(n1, n2)) break;
      html = rest.trimStart();
    }
    return html;
  }

  const blocks = content.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  if (blocks.length < 2) return content;
  let drop = 0;
  while (
    drop + 1 < blocks.length &&
    paragraphsAreDuplicate(
      normalizeContentPlainText(blocks[drop]),
      normalizeContentPlainText(blocks[drop + 1]),
    )
  ) {
    drop += 1;
  }
  return drop > 0 ? blocks.slice(drop).join("\n\n") : content;
}

function excerptCoversMostOfBody(excerptNorm: string, bodyNorm: string) {
  if (!excerptNorm || !bodyNorm) return false;
  if (excerptNorm === bodyNorm) return true;
  return (
    excerptNorm.length >= bodyNorm.length * 0.85 &&
    bodyNorm.startsWith(excerptNorm.slice(0, Math.min(200, excerptNorm.length)))
  );
}

function stripExcerptPrefixOverlap(content: string, excerpt?: string): string {
  const excerptNorm = normalizeContentPlainText(excerpt);
  const bodyNorm = normalizeContentPlainText(content);
  if (!content?.trim() || excerptNorm.length < 80) return content;
  if (excerptCoversMostOfBody(excerptNorm, bodyNorm)) return content;

  if (looksLikeHtml(content)) {
    const blocks = extractHtmlContentBlocks(content);
    if (!blocks.length) return content;

    let consumed = "";
    let skip = 0;
    for (const block of blocks) {
      const norm = normalizeContentPlainText(block);
      if (!norm) {
        skip += 1;
        continue;
      }
      const nextConsumed = consumed ? `${consumed} ${norm}` : norm;
      if (
        excerptNorm.startsWith(nextConsumed) ||
        excerptNorm.startsWith(norm) ||
        (consumed && norm.startsWith(excerptNorm.slice(consumed.length, consumed.length + 80)))
      ) {
        consumed = nextConsumed;
        skip += 1;
        continue;
      }
      break;
    }

    if (skip > 0) {
      const kept = blocks.slice(skip);
      return kept.map((t) => `<p>${escapeHtmlText(processPlainBlockText(t))}</p>`).join("\n");
    }
    return content;
  }

  const parts = content.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  let consumed = "";
  let skip = 0;
  for (const block of parts) {
    const norm = normalizeContentPlainText(block);
    const nextConsumed = consumed ? `${consumed} ${norm}` : norm;
    if (excerptNorm.startsWith(nextConsumed) || excerptMatchesBody(excerptNorm, norm)) {
      consumed = nextConsumed;
      skip += 1;
      continue;
    }
    break;
  }
  if (skip > 0) return parts.slice(skip).join("\n\n");
  return content;
}

/** Excerpt for the article header — avoids repeating the full imported body. */
export function resolveDisplayExcerpt(
  excerpt?: string,
  content?: string,
): string | undefined {
  const trimmed = excerpt?.trim();
  if (!trimmed) return undefined;

  const excerptNorm = normalizeContentPlainText(trimmed);
  const bodyNorm = normalizeContentPlainText(content);
  const leading = getLeadingBodyPlainText(content);
  const maxLen = 280;

  if (!bodyNorm) {
    return trimmed.length > maxLen ? `${trimmed.slice(0, maxLen).trim()}…` : trimmed;
  }

  if (excerptNorm === bodyNorm) return undefined;

  if (
    leading &&
    (excerptMatchesBody(excerptNorm, leading) ||
      openParagraphMatches(excerptNorm, leading))
  ) {
    return undefined;
  }

  if (bodyNorm.startsWith(excerptNorm) && excerptNorm.length > 120) {
    return undefined;
  }

  if (bodyNorm.startsWith(excerptNorm) && excerptNorm.length >= 40) {
    return undefined;
  }

  if (excerptNorm.length > bodyNorm.length * 0.55 && bodyNorm.length > 200) {
    const sentence =
      trimmed.match(/^[\s\S]{1,300}?[.!?…](?:\s|$)/)?.[0]?.trim() ??
      trimmed.slice(0, maxLen).trim();
    return sentence.length >= 40 && sentence.length <= maxLen + 20
      ? sentence
      : undefined;
  }

  if (trimmed.length > maxLen) {
    return `${trimmed.slice(0, maxLen).trim()}…`;
  }

  return trimmed;
}

function excerptMatchesBody(excerptNorm: string, bodyNorm: string): boolean {
  if (!excerptNorm || !bodyNorm) return false;
  if (excerptNorm === bodyNorm) return true;
  const shorter = excerptNorm.length <= bodyNorm.length ? excerptNorm : bodyNorm;
  const longer = excerptNorm.length > bodyNorm.length ? excerptNorm : bodyNorm;
  if (shorter.length < 48) return shorter === longer;
  return longer.startsWith(shorter) || shorter.startsWith(longer);
}

function stripHtmlToPlain(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function openParagraphMatches(a: string, b: string) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length < 48) return false;
  const probe = a.slice(0, Math.min(120, a.length));
  return b.startsWith(probe) || a.startsWith(b.slice(0, Math.min(120, b.length)));
}

/** Remove repeated sentences inside one paragraph (common in WP imports). */
function dedupeSentencesInPlainText(text: string): string {
  const stripped = text.replace(/\s+/g, " ").trim();
  if (!stripped) return text;

  const sentences = stripped.split(/(?<=[.!?…"”'])\s+(?=[A-Z0-9"'(])/);
  const out: string[] = [];
  const seen = new Set<string>();

  for (const raw of sentences) {
    const sentence = raw.trim();
    if (!sentence) continue;

    const key = normalizeContentPlainText(sentence);
    if (key.length < 24) {
      out.push(sentence);
      continue;
    }

    if (seen.has(key)) continue;

    const lastKey =
      out.length > 0 ? normalizeContentPlainText(out[out.length - 1]) : "";
    if (lastKey && lastKey.includes(key)) continue;
    if (lastKey && key.includes(lastKey) && key.length > lastKey.length * 1.1) {
      seen.delete(lastKey);
      out[out.length - 1] = sentence;
      seen.add(key);
      continue;
    }

    seen.add(key);
    out.push(sentence);
  }

  return out.join(" ");
}

function dedupeParagraphInner(html: string): string {
  const open = html.match(/^<p[^>]*>/i)?.[0] ?? "<p>";
  const inner = html.replace(/^<p[^>]*>/i, "").replace(/<\/p>\s*$/i, "");
  const deduped = processPlainBlockText(inner);
  if (!deduped) return html;
  return `${open}${escapeHtmlText(deduped)}</p>`;
}

function paragraphsAreDuplicate(prevNorm: string, nextNorm: string) {
  if (!prevNorm || !nextNorm) return false;
  if (prevNorm === nextNorm) return true;

  if (nextNorm.length >= 48 && prevNorm.includes(nextNorm)) {
    return true;
  }

  if (prevNorm.length >= 48 && nextNorm.includes(prevNorm)) {
    return nextNorm.length <= prevNorm.length * 1.12;
  }

  return false;
}

function findArticleRestartIndex(norms: string[]): number | null {
  if (norms.length < 4) return null;

  const first = norms.find((n) => n.length >= 40);
  if (!first) return null;

  const minRestart = Math.max(2, Math.floor(norms.length / 3));
  for (let i = minRestart; i < norms.length; i++) {
    if (openParagraphMatches(first, norms[i] ?? "")) {
      return i;
    }
  }

  const mid = Math.floor(norms.length / 2);
  if (norms[mid] && openParagraphMatches(first, norms[mid])) {
    return mid;
  }

  return null;
}

function filterDuplicateParagraphBlocks(blocks: string[]): string[] {
  const cleaned = blocks.map((block) =>
    looksLikeHtml(block) ? dedupeParagraphInner(block) : dedupeSentencesInPlainText(block),
  );

  const filtered: string[] = [];
  for (const block of cleaned) {
    const norm = normalizeContentPlainText(block);
    if (!norm) continue;

    const lastNorm =
      filtered.length > 0
        ? normalizeContentPlainText(filtered[filtered.length - 1])
        : "";
    if (paragraphsAreDuplicate(lastNorm, norm)) continue;

    filtered.push(block);
  }

  const norms = filtered.map((b) => normalizeContentPlainText(b));
  const restartAt = findArticleRestartIndex(norms);
  if (restartAt != null) {
    return filtered.slice(0, restartAt);
  }

  return filtered;
}

function dedupePlainBody(content: string): string {
  const blocks = content.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const processed = blocks.map((b) => processPlainBlockText(b)).filter(Boolean);
  return filterDuplicateParagraphBlocks(processed).join("\n\n");
}

/** Drop leading paragraph(s) that repeat the excerpt shown above the body. */
export function stripDuplicateExcerptFromContent(content: string, excerpt?: string): string {
  const excerptNorm = normalizeContentPlainText(excerpt);
  const bodyNorm = normalizeContentPlainText(content);
  if (!content?.trim() || !excerptNorm) return content;
  if (excerptCoversMostOfBody(excerptNorm, bodyNorm)) return content;

  if (looksLikeHtml(content)) {
    let html = content;
    for (let pass = 0; pass < 3; pass++) {
      const match = html.match(
        /^(\s*(?:<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>\s*)*)<p[^>]*>([\s\S]*?)<\/p>/i,
      );
      if (!match) break;
      const firstNorm = normalizeContentPlainText(match[2]);
      if (!excerptMatchesBody(excerptNorm, firstNorm)) break;
      html = html.slice(match[0].length).trimStart();
    }
    return html;
  }

  const blocks = content.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  let start = 0;
  while (
    start < blocks.length &&
    excerptMatchesBody(excerptNorm, normalizeContentPlainText(blocks[start]))
  ) {
    start += 1;
  }
  if (start > 0) {
    return blocks.slice(start).join("\n\n");
  }

  return content;
}

/**
 * Clean imported article HTML/plain text: strip excerpt repeats, duplicate paragraphs,
 * repeated sentences, and full-body restarts (common in WordPress opinion imports).
 */
export function prepareArticleBody(content: string, excerpt?: string): string {
  if (!content?.trim()) return content;

  let body = stripDuplicateExcerptFromContent(content, excerpt);
  body = stripExcerptPrefixOverlap(body, excerpt);
  body = stripLeadingConsecutiveDuplicateParagraphs(body);
  body = looksLikeHtml(body) ? rebuildCleanArticleHtml(body) : dedupePlainBody(body);
  body = stripLeadingConsecutiveDuplicateParagraphs(body);
  return body;
}

function sanitizeArticleHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
}

const HTML_CONTENT_CLASS =
  "article-body-html [&_p]:mb-6 [&_p]:leading-relaxed [&_h2]:font-serif [&_h2]:text-[26px] [&_h2]:mt-12 [&_h2]:mb-5 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:mt-8 [&_h3]:mb-4 [&_a]:text-primary [&_a]:underline [&_img]:my-8 [&_img]:max-w-full [&_ul]:my-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-[3px] [&_blockquote]:border-[#C41E3A] [&_blockquote]:pl-8 [&_blockquote]:py-2 [&_blockquote]:my-10 [&_blockquote]:font-serif [&_blockquote]:text-[22px]";

function renderBlock(block: string, key: number) {
  if (block.startsWith("## ")) {
    return (
      <h2 key={key} className="font-serif text-[26px] mt-12 mb-5 text-foreground">
        {block.slice(3)}
      </h2>
    );
  }
  if (block.startsWith("# ")) {
    return (
      <h2 key={key} className="font-serif text-[26px] mt-12 mb-5 text-foreground">
        {block.slice(2)}
      </h2>
    );
  }
  if (block.startsWith("> ") || (block.startsWith('"') && block.endsWith('"'))) {
    return (
      <blockquote
        key={key}
        className="border-l-[3px] border-[#C41E3A] pl-8 py-2 my-10 font-serif text-[22px] leading-snug text-foreground"
      >
        {block.startsWith("> ") ? block.slice(2) : block}
      </blockquote>
    );
  }
  const imgMatch = block.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (imgMatch) {
    return (
      <figure key={key} className="my-8">
        <img
          src={imgMatch[2]}
          alt={imgMatch[1]}
          className="w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        {imgMatch[1] && (
          <figcaption className="text-[12px] text-muted-foreground mt-2 text-center">
            {imgMatch[1]}
          </figcaption>
        )}
      </figure>
    );
  }
  return (
    <p key={key} className="mb-6">
      {block}
    </p>
  );
}

export function renderContent(
  content: string,
  options?: { midContentAd?: ReactNode },
) {
  if (!content || content.trim() === "" || content.trim() === "Full content here...") {
    return (
      <p className="text-muted-foreground">
        No content has been added to this article yet.
      </p>
    );
  }

  if (looksLikeHtml(content)) {
    return (
      <div
        className={HTML_CONTENT_CLASS}
        dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(content) }}
      />
    );
  }

  const blocks = content.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const adInsertIndex = options?.midContentAd
    ? getAdInsertIndex(blocks.length)
    : null;

  return (
    <>
      {blocks.map((block, i) => (
        <Fragment key={i}>
          {renderBlock(block, i)}
          {adInsertIndex === i && options?.midContentAd}
        </Fragment>
      ))}
    </>
  );
}

export function extractHeadings(content: string): string[] {
  if (!content) return [];

  if (looksLikeHtml(content)) {
    const headings: string[] = [];
    const re = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
    let match;
    while ((match = re.exec(content)) !== null) {
      const text = match[1].replace(/<[^>]+>/g, "").trim();
      if (text) headings.push(text);
    }
    return headings;
  }

  return content
    .split("\n")
    .filter((line) => line.startsWith("## ") || line.startsWith("# "))
    .map((line) => line.replace(/^#{1,2} /, ""));
}
