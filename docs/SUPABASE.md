# Supabase + Hostinger setup

**Supabase** stores article text, ads, CMS users, and staff bios.  
**Hostinger** stores image files — only HTTPS URLs are saved in the database.

## 1. Create database tables

In Supabase → **SQL Editor**, run your schema migrations (articles, ads, admin_users, staff_profiles).

### Tables ↔ admin dashboard

| Table | Admin section | Public site |
|-------|---------------|-------------|
| `articles` | Articles | News pages, search, author bylines |
| `ads` | Advertisements | Header, homepage, in-article banners |
| `admin_users` | Admin Users | CMS only (not public) |
| `staff_profiles` | Staff | `/author/[slug]` pages |

## 2. Environment variables

Fill in `.env` (three values from Supabase → Project Settings → API):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser client (RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Required for admin save/delete** (Articles API) and bulk import — **never** expose in client code |

Articles always load from **Supabase** once `.env` is set. There is no localStorage fallback for news stories.

## 3. Connect the app

1. Fill in all three `.env` values  
2. Restart `npm run dev`  

> **Note:** Only **articles** read/write Supabase in code today. Ads, users, and staff still use localStorage until wired (schema is ready).

## 4. Import your archive (~6,966 articles)

Save your export as **`data/extracted.csv`**, then:

```bash
npm run import-articles:supabase
```

JSON instead: `npm run import-articles:supabase:json` with `data/extracted.json`.

## 5. Hostinger images (FTP upload from admin)

Image **files** live on Hostinger. Supabase stores only the public URL.

Add to `.env` (server-only — never commit):

| Variable | Purpose |
|----------|---------|
| `FTP_HOST` | e.g. `ftp.palawandailynews.com` |
| `FTP_PORT` | Usually `21` |
| `FTP_USER` | Hostinger FTP username |
| `FTP_PASSWORD` | Hostinger FTP password |
| `FTP_PUBLIC_BASE_URL` | e.g. `https://palawandailynews.com` |
| `FTP_UPLOADS_DIR` | Folder inside Hostinger **public_html** (site root), default `pdn_new_website_uploads` |
| `FTP_PUBLIC_WEB_PREFIX` | Leave empty — images are served at `https://yoursite.com/pdn_new_website_uploads/...` |
| `FTP_SECURE` | `true` for FTPS, else `false` |

Admin **Articles** and **Ads** upload via `POST /api/admin/upload-image` → FTP → returns a URL saved in `articles.image_url` or `ads.image_url`.

Imported archives can still use full URLs (`https://palawandailynews.com/wp-content/uploads/...`).

## 6. Remove legacy `media` table

If your project still has a `media` table from an older schema, run:

```bash
# Or paste supabase/migrations/007_drop_media.sql in Supabase SQL Editor
```

File: `supabase/migrations/007_drop_media.sql`

## 7. Auth (next step)

Migrations include `admin_users.auth_user_id` → `auth.users` for Supabase Auth login. RLS already allows `authenticated` roles to manage CMS data.

## Architecture

```
Admin dashboard
  Articles      → articles
  Ads           → ads
  Admin Users   → admin_users
  Staff         → staff_profiles

Public site ← Supabase (read via RLS) + image URLs → Hostinger
```
