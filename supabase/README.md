# Galera × Supabase — backend setup

This folder holds the SQL to stand up the backend. Run it once in your
Supabase project, then give me the project URL + anon key so I can wire the
frontend to it.

## 1. Run the SQL (Supabase → SQL Editor)

Run **in this order**:

1. **`schema.sql`** — tables, Row-Level Security policies, and the `uploads`
   storage bucket. Safe to re-run.
2. **`seed.sql`** — the current content (4 artists, their tiers, 24 artworks,
   6 forum threads + seed posts). Idempotent — re-running refreshes content.

## 2. Configure Auth (Supabase → Authentication)

- **Providers → Email**: enable. For local testing you can turn *"Confirm email"*
  **off** so sign-ups log in immediately; turn it back on for production.
- **Providers → Google / Apple** (optional): enable and paste their OAuth
  credentials if you want the social buttons live.
- **URL Configuration → Site URL / Redirect URLs**: add your local dev origin
  (e.g. `http://localhost:8321`) and your deployed origin
  (e.g. `https://artgalera.netlify.app`).

## 3. Give me the keys

From **Project Settings → API**, send me:

- **Project URL** — `https://<ref>.supabase.co`
- **anon / publishable key** — the public key (safe to commit; RLS protects it)

⚠️ **Never** share or commit the **`service_role`** key — it bypasses RLS. It's
only for server-side/admin tasks (like seeding), never in the browser.

I'll drop the URL + anon key into `assets/js/supabase.js`, add the two script
tags to each page, and convert the frontend from its `localStorage` demo to
real Supabase — in verifiable stages (auth → catalog reads → pledges/likes/
favourites → forum → uploads).

## Model (one account type)

Every user is a `profiles` row. A user **becomes an artist** by flipping
`is_artist` (the opt-in toggle) and filling their artist fields. Artworks
belong to the user who uploaded them — an upload *is* an artwork.

| App concept | Table / bucket |
|---|---|
| Any user (and artist profile) | `profiles` (`is_artist` opt-in; auto-created on signup) |
| Artworks (free uploads) | `artworks` (public read; `user_id` = creator) |
| Artist membership tiers (optional premium) | `tiers` (per artist) |
| Join an artist's tier | `memberships` (subscriber → artist → tier) |
| Premium content flag | `artworks.is_premium` (gated by membership — seam for later) |
| Saved works / likes | `favourites`, `artwork_likes` |
| Forum | `threads`, `posts`, `post_likes` |
| Uploaded image files | `artworks` storage bucket (`<uid>/<file>`) |

**Designed-for-later (additive, no restructuring):** follows, limited
editions, commissions, digital gifts, collectibles, Galera Premium.
