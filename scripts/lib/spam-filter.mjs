/**
 * Detects casino / gambling SEO spam common in compromised WordPress exports.
 * Used as a safety net during import — you may already filter these in your export.
 */

const CASINO_GAMBLING_RE =
  /\b(?:online[-\s]?casino|casino[-\s]?games?|gambling|sportsbook|slot[-\s]?machines?|jackpot|poker[-\s]?online|roulette|blackjack|baccarat|betting[-\s]?sites?|wager(?:ing)?|free[-\s]?spins?|no[-\s]?deposit|live[-\s]?dealer|sabong[-\s]?bet|e-?sabong|pagcor[-\s]?license|gacor|slot[-\s]?gacor|judi[-\s]?online|taruhan)\b/i;

const SPAM_TITLE_RE =
  /\b(?:best|top|review|bonus|promo)\b.*\b(?:casino|betting|gambling|slots?)\b/i;

const SPAM_CATEGORY_RE = /^(?:casino|gambling|betting|slots?)$/i;

/** @param {Record<string, unknown>} row */
export function isCasinoGamblingSpam(row) {
  const values = Object.values(row)
    .filter((v) => typeof v === "string" && v.trim())
    .map((v) => String(v));

  const title = String(row.title ?? row.post_title ?? "");
  const category = String(row.category ?? row.categories ?? "");

  if (SPAM_CATEGORY_RE.test(category.trim())) return true;
  if (SPAM_TITLE_RE.test(title)) return true;

  return CASINO_GAMBLING_RE.test(values.join(" "));
}
