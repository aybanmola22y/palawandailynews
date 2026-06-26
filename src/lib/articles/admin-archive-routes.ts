/** Admin routes that need the full article table (not just the recent bootstrap slice). */
export function adminPathNeedsFullArchive(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? pathname;
  return path === "/admin/articles";
}
