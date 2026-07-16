# GALERA — Support the Artists Behind the Art You Love

A Patreon-style platform for digital artists (think WLOP, Sakimichan): artists post their
work publicly, fans support them with monthly tiers and unlock the studio — 4K files,
PSDs, process videos, votes, live paint-alongs.

Static site — no build step, no backend. Open `index.html` or serve the folder:

```
npx http-server -p 8321 .
```

## Pages

| Page | What it does |
|---|---|
| `index.html` | Hero, trending works, how-it-works, featured artists, community, newsletter |
| `gallery.html` | All artworks: filters (category / artist / access), sorting, lightbox with likes & artist CTA, deep links (`?art=id`), saving, **member uploads** (demo, stored in browser) |
| `artists.html` / `artist.html` | Artist directory; profiles with cover, stats, bio and **support tiers** (join/cancel, demo pledges) |
| `explore.html` | Articles: process breakdowns, creator guides, essays — reading overlay, deep links |
| `community.html` | Forum — teaser for guests, full threads/posting/likes for members |
| `auth.html` / `account.html` | Register/sign-in (validation, MFA opt-in, social/passkey placeholders); dashboard with memberships, saved works, security, GDPR export/delete |
| `about.html`, `contact.html`, `legal.html`, `404.html` | Platform story & promises, contact, plain-language privacy/terms |

Global: Ctrl+K search, mobile nav, consent notice, reveal-on-scroll, responsive throughout.

## Content

- All data (artists, artworks, tiers, articles, threads) lives in `assets/js/data.js`.
- Images are in `assets/img/art/` — resized from `D:\BG\Wallpapers\WLOP`.
- Membership, pledges, likes, saves and uploads are `localStorage` demos; nothing is
  transmitted. Wire up real auth + payments (Stripe) to productionise.

> **⚠ Placeholder art:** the artworks are wallpapers © their original artists
> (including WLOP) used for layout only. Replace with licensed uploads before deploying.
> The artist profiles other than the WLOP placeholder are fictional.
