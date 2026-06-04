# Article backup (deferred)

The admin dashboard backup UI is **turned off for now**. It will be integrated again later.

Code kept in the repo for reuse:

- `src/components/admin/ArticleBackupCard.tsx`
- `src/lib/articles/article-backup-meta.ts`, `article-csv-export.ts`, `article-backup.ts`
- `scripts/create-article-backup-meta.sql`, `scripts/backup-articles-to-csv.mjs`
- `npm run backup-articles:csv` (CLI only, optional)

When re-enabling: restore API routes under `src/app/api/admin/backup/articles/`, add `<ArticleBackupCard />` to the dashboard, and wire the sidebar badge in `AdminLayout.tsx`.
