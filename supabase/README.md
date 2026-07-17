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
| Follow an artist | `follows` (maintains `follower_count` / `following_count`) |
| Artworks (free uploads) | `artworks` (uuid PK + `slug`; `user_id` = creator) |
| Comments on artworks | `comments` (threaded via `parent_id`; maintains `comment_count`) |
| Likes | `artwork_likes` / `post_likes` (maintain `like_count`) |
| Artist membership tiers | `tiers` (`price_cents` + `currency`, per artist) |
| Join an artist's tier | `memberships` (subscriber → artist → tier, `status`) |
| Premium content | `artworks.is_premium` + `unlock_tier_id` seam |
| Saved works | `favourites` |
| Forum | `threads` (uuid + `slug`), `posts`, `post_likes` |
| Uploaded image files | `artworks` storage bucket (`<uid>/<file>`) |

### Built for the long term (in the base schema now)
- **UUID PKs + slugs** on every entity → future tables reference them freely.
- **Money in minor units** (`price_cents` + `currency`); `memberships` carries
  `provider` / `provider_ref` / `current_period_end` / `cancel_at` → Stripe/Paddle drop in.
- **Denormalized counters** (`like_count`, `comment_count`, `view_count`,
  `follower_count`) via triggers → O(1) reads; **every FK indexed**.
- **Search**: `pg_trgm` trigram indexes on `profiles.name`/`handle`; a generated
  `tsvector` + GIN on `artworks` (title + note + tags).
- **Content lifecycle**: `status` (draft/scheduled/published) + `visibility`
  (public/members/private) + `published_at` + `deleted_at` (soft delete).
- **Identity/trust**: `role` (user/moderator/admin) + `is_staff()`, `is_verified`.
- **Analytics**: `artwork_views` (with `ip_hash`) → trending / unique visitors /
  creator stats; feeds `view_count` via trigger.
- **Engagement/safety**: `notifications`, `follows`, `comments`, `blocks`,
  `reports` (polymorphic), `audit_log` (staff-only).
- **Storage**: `artworks` + `avatars` buckets, files under `<uid>/…` (per-user RLS).
- **OAuth-ready**: the signup trigger reads `full_name`/`name`/`avatar_url`
  from Google/Apple metadata.

**Verified additive (build later, no restructuring — see the note at the
bottom of `schema.sql`):** badge system, activity-events table, comment likes,
orders/payments, collectibles / limited editions, commissions, gifts, and
Galera Premium billing (`profiles.premium_until` already present).

### Tables (16)
`profiles`, `follows`, `artworks`, `artwork_views`, `comments`, `tiers`,
`memberships`, `favourites`, `artwork_likes`, `threads`, `posts`, `post_likes`,
`notifications`, `blocks`, `reports`, `audit_log`.
