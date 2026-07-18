-- ============================================================
--  Migration: membership-aware read policy on artworks
--
--  Before: visibility='members' artworks were readable only by their owner
--  and staff (fail-closed placeholder). Now an ACTIVE member of the artist's
--  tiers can read that artist's members-only works too.
--
--  Comments inherit automatically: their read policy already checks the
--  parent artwork through this policy's filter. Safe to re-run.
--  Also folded into schema.sql.
--
--  Run in: Supabase → SQL Editor.
-- ============================================================

drop policy if exists p_read_artworks on public.artworks;
create policy p_read_artworks on public.artworks for select using (
  (deleted_at is null and status = 'published'
     and (published_at is null or published_at <= now())
     and (
       visibility = 'public'
       or (visibility = 'members' and exists (
             select 1 from public.memberships m
             where m.subscriber_id = auth.uid()
               and m.artist_id = user_id
               and m.status = 'active'))
     ))
  or auth.uid() = user_id
  or public.is_staff()
);

-- ------------------------------------------------------------
-- TEST FIXTURE (run this too; I'll verify from the browser, then you run the
-- revert). Flips one WLOP seed artwork to members-only:
--
-- update public.artworks set visibility = 'members' where slug = 'w-blossom';
--
-- REVERT (after verification):
--
-- update public.artworks set visibility = 'public' where slug = 'w-blossom';
-- ------------------------------------------------------------
