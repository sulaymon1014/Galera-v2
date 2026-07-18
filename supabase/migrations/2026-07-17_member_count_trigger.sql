-- ============================================================
--  Migration: maintain profiles.member_count from memberships
--
--  Adds a trigger so an artist's "supporters" number moves when a member
--  joins, leaves, or their membership status changes. Mirrors the pattern of
--  bump_follow_counts / bump_like_count in schema.sql.
--
--  DELTA-BASED (±1) by design: it does NOT recompute from scratch, so the
--  seeded demo supporter numbers on each artist are preserved and simply move
--  up/down from that base. Safe to re-run. Also folded into schema.sql.
--
--  Run in: Supabase → SQL Editor.
-- ============================================================

create or replace function public.bump_member_counts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    if (new.status = 'active') then
      update public.profiles set member_count = member_count + 1 where id = new.artist_id;
    end if;

  elsif (tg_op = 'DELETE') then
    if (old.status = 'active') then
      update public.profiles set member_count = greatest(member_count - 1, 0) where id = old.artist_id;
    end if;

  elsif (tg_op = 'UPDATE') then
    if (old.artist_id = new.artist_id) then
      -- same artist: only a status transition into/out of 'active' changes the count
      if (old.status = 'active' and new.status is distinct from 'active') then
        update public.profiles set member_count = greatest(member_count - 1, 0) where id = new.artist_id;
      elsif (old.status is distinct from 'active' and new.status = 'active') then
        update public.profiles set member_count = member_count + 1 where id = new.artist_id;
      end if;
    else
      -- artist changed (rare): move any active count from the old artist to the new
      if (old.status = 'active') then
        update public.profiles set member_count = greatest(member_count - 1, 0) where id = old.artist_id;
      end if;
      if (new.status = 'active') then
        update public.profiles set member_count = member_count + 1 where id = new.artist_id;
      end if;
    end if;
  end if;
  return null;
end; $$;

drop trigger if exists trg_member_counts on public.memberships;
create trigger trg_member_counts after insert or update or delete on public.memberships
  for each row execute function public.bump_member_counts();

-- ------------------------------------------------------------
-- OPTIONAL — only if you ever want member_count to equal the REAL number of
-- active members (this discards the seeded vanity numbers). Leave commented
-- to keep the demo counts.
--
-- update public.profiles p
--   set member_count = (select count(*) from public.memberships m
--                       where m.artist_id = p.id and m.status = 'active');
-- ------------------------------------------------------------
