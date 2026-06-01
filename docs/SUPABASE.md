# Supabase + Hostinger setup

**Supabase** stores article text, ads, CMS users, staff bios, and media metadata.  
**Hostinger** stores image files — only HTTPS URLs are saved in the database.

## 1. Create database tables

In Supabase → **SQL Editor**, run either:

- **All at once:** paste `supabase/schema-full.sql`  
- **Step by step:** run `supabase/migrations/001` through `006` in order  

See [supabase/migrations/README.md](../supabase/migrations/README.md) for the admin mapping.

### Tables ↔ admin dashboard

| Table | Admin section | Public site |
|-------|---------------|-------------|
| `articles` | Articles | News pages, search, author bylines |
| `media` | Media Library | Image URLs in articles/ads |
| `ads` | Advertisements | Header, homepage, in-article banners |
| `admin_users` | Admin Users | CMS only (not public) |
| `staff_profiles` | Staff | `/author/[slug]` pages |

## 2. Environment variables

Fill in `.env` (three values from Supabase → Project Settings → API):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser client (RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Bulk import only — **never** expose in client code |

Articles always load from **Supabase** once `.env` is set. There is no localStorage fallback for news stories.

## 3. Connect the app

1. Fill in all three `.env` values  
2. Restart `npm run dev`  

> **Note:** Only **articles** read/write Supabase in code today. Ads, users, staff, and media still use localStorage until wired (schema is ready).

## 4. Import your archive (~6,966 articles)

Save your export as **`data/extracted.csv`**, then:

```bash
npm run import-articles:supabase
```

JSON instead: `npm run import-articles:supabase:json` with `data/extracted.json`.

## 5. Hostinger images

- Article featured image → `articles.image_url`  
- Ad banners → `ads.image_url`  
- Media library → `media.url`  

Use full URLs (`https://palawandailynews.com/wp-content/uploads/...`) in your import data.

## 6. Auth (next step)

Migrations include `admin_users.auth_user_id` → `auth.users` for Supabase Auth login. RLS already allows `authenticated` roles to manage CMS data.

## Architecture

```
Admin dashboard
  Articles      → articles
  Media Library → media (+ files on Hostinger)
  Ads           → ads
  Admin Users   → admin_users
  Staff         → staff_profiles

Public site ← Supabase (read via RLS) + image URLs → Hostinger
```
