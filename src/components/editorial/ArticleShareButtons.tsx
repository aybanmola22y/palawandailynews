"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Facebook, Linkedin, Link as LinkIcon, Twitter } from "lucide-react";
import { getSiteUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";

type ArticleShareButtonsProps = {
  articleId: string;
  title: string;
  className?: string;
};

/** Public URL Facebook/X/LinkedIn can fetch — never localhost. */
function canonicalArticleUrl(articleId: string) {
  return `${getSiteUrl()}/article/${encodeURIComponent(articleId)}`;
}

function copyableArticleUrl(articleId: string) {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/article/${encodeURIComponent(articleId)}`;
  }
  return canonicalArticleUrl(articleId);
}

function openShareWindow(url: string) {
  const width = 640;
  const height = 620;
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));
  // Unique name each time so Facebook does not reuse a stuck "Create post" tab.
  const name = `pdn-share-${Date.now()}`;
  const popup = window.open(
    url,
    name,
    `noopener,noreferrer,width=${width},height=${height},left=${left},top=${top}`,
  );
  if (!popup) {
    // Popup blocked — fall back to a normal tab.
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function ArticleShareButtons({
  articleId,
  title,
  className,
}: ArticleShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const shareFacebook = useCallback(() => {
    const articleUrl = canonicalArticleUrl(articleId);
    const params = new URLSearchParams({
      u: articleUrl,
      quote: title,
    });
    openShareWindow(`https://www.facebook.com/sharer/sharer.php?${params.toString()}`);
  }, [articleId, title]);

  const shareTwitter = useCallback(() => {
    const params = new URLSearchParams({
      url: canonicalArticleUrl(articleId),
      text: title,
    });
    openShareWindow(`https://twitter.com/intent/tweet?${params.toString()}`);
  }, [articleId, title]);

  const shareLinkedIn = useCallback(() => {
    const params = new URLSearchParams({
      url: canonicalArticleUrl(articleId),
    });
    openShareWindow(
      `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`,
    );
  }, [articleId]);

  const copyLink = useCallback(async () => {
    const url = copyableArticleUrl(articleId);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("input");
        input.value = url;
        input.setAttribute("readonly", "");
        input.style.position = "absolute";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }, [articleId]);

  const buttonClass =
    "p-2 border border-border rounded-sm hover:border-primary hover:text-primary transition-colors";

  return (
    <div className={cn("flex gap-4", className)} role="group" aria-label="Share this article">
      <button
        type="button"
        onClick={shareFacebook}
        className={buttonClass}
        aria-label="Share on Facebook"
      >
        <Facebook className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={shareTwitter}
        className={buttonClass}
        aria-label="Share on X"
      >
        <Twitter className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={shareLinkedIn}
        className={buttonClass}
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => void copyLink()}
        className={cn(buttonClass, copied && "border-primary text-primary")}
        aria-label={copied ? "Link copied" : "Copy link"}
      >
        {copied ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
      </button>
    </div>
  );
}
