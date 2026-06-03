/**
 * Heuristic checks for obvious injection payloads in URLs (not article body text).
 * Supabase uses parameterized queries; this is defense-in-depth at the edge.
 */
const SQLI_PATTERNS: RegExp[] = [
  /\bunion\b[\s/\*]+(?:all\s+)?\bselect\b/i,
  /\bselect\b[\s/\*]+.+\bfrom\b[\s/\*]+\w+/i,
  /\binsert\b\s+into\b/i,
  /\bupdate\b\s+\w+\s+set\b/i,
  /\bdelete\b\s+from\b/i,
  /\bdrop\b\s+(?:table|database|view)\b/i,
  /\bexec(?:ute)?\s*\(/i,
  /\bxp_cmdshell\b/i,
  /\binformation_schema\b/i,
  /'\s*or\s*'1'\s*=\s*'1/i,
  /"\s*or\s*"1"\s*=\s*"1/i,
  /\bor\s+1\s*=\s*1\b/i,
  /;\s*--/,
  /\/\*[\s\S]*?\*\//,
];

const ENCODED_SQLI = /%27|%22|%3b%20*--|%2d%2d/i;

export function containsSqlInjectionPatterns(value: string): boolean {
  const sample = value.slice(0, 2048);
  if (ENCODED_SQLI.test(sample)) return true;
  return SQLI_PATTERNS.some((re) => re.test(sample));
}

export function scanRequestForSqlInjection(request: {
  pathname: string;
  search: string;
}): boolean {
  const target = `${request.pathname}${request.search}`;
  return containsSqlInjectionPatterns(target);
}
