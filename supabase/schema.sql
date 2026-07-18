-- ============================================================
--  GALERA — database schema  (run FIRST, in the Supabase SQL editor)
--
--  Premium platform for digital artists. ONE account type; any user opts
--  in to become an artist (profiles.is_artist). MVP = free artwork uploads
--  + optional premium content gated by membership tiers.
--
--  Long-term foundations baked in now (cheap now, painful to retrofit):
--   * UUID PKs + human slugs on every entity.
--   * Money in minor units (cents) + currency; payment-provider columns.
--   * Denormalized counters (likes/comments/views/followers) via triggers;
--     every FK indexed; trigram + full-text search indexes.
--   * Content lifecycle: status (draft/scheduled/published) + visibility
--     (public/members/private) + soft delete.
--   * Moderation: roles, reports, audit log, blocks.
--   * Analytics: artwork_views + view_count.
--   * Notifications.
--
--  Deferred (additive later — see FUTURE note at bottom): badge system,
--  activity-events table, comment likes, orders/payments, collectibles /
--  limited editions, commissions, gifts, Galera Premium billing.
--  Safe to re-run.
-- ============================================================

create extension if not exists pg_trgm;   -- fuzzy search / autocomplete

-- ---------- helpers ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ============================================================
--  profiles: one row per user; artists are users with is_artist = true
-- ============================================================
create table if not exists public.profiles (
  id              uuid primary key default gen_random_uuid(),
  handle          text unique,
  name            text not null default 'Member',
  -- NOTE: email intentionally NOT stored here — profiles are world-readable.
  -- The address lives in auth.users (private to the user's own session).
  role            text not null default 'user' check (role in ('user','moderator','admin')),
  avatar_url      text,
  cover_url       text,
  tagline         text,
  bio             text,
  statement       text,
  is_artist       boolean not null default false,
  is_verified     boolean not null default false,     -- verified artist badge
  verified_at     timestamptz,
  premium_until   timestamptz,                          -- Galera Premium seam
  follower_count  int not null default 0,
  following_count int not null default 0,
  member_count    int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists profiles_name_trgm   on public.profiles using gin (name gin_trgm_ops);
create index if not exists profiles_handle_trgm on public.profiles using gin (handle gin_trgm_ops);
create index if not exists profiles_artist_idx  on public.profiles (is_artist) where is_artist;
drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- staff check (used by moderation RLS). security definer bypasses profiles RLS.
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator','admin'));
$$;

-- auto-create a profile on signup (handles email + OAuth metadata)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',
             new.raw_user_meta_data->>'name',
             split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url',
             new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ...and remove it when the auth user is deleted (FKs cascade from profiles;
-- comments/posts keep content with a nulled author; Storage files are NOT
-- touched — clean orphans from the Storage dashboard if needed)
create or replace function public.handle_deleted_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end; $$;
drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users for each row execute function public.handle_deleted_user();

-- ============================================================
--  follows
-- ============================================================
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index if not exists follows_followee_idx on public.follows (followee_id);

create or replace function public.bump_follow_counts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.profiles set follower_count  = follower_count  + 1 where id = new.followee_id;
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
  elsif (tg_op = 'DELETE') then
    update public.profiles set follower_count  = greatest(follower_count  - 1, 0) where id = old.followee_id;
    update public.profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
  end if;
  return null;
end; $$;
drop trigger if exists trg_follow_counts on public.follows;
create trigger trg_follow_counts after insert or delete on public.follows
  for each row execute function public.bump_follow_counts();

-- ============================================================
--  artworks (uploaded by a user). Lifecycle + visibility + search.
-- ============================================================
create table if not exists public.artworks (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  image_path    text not null,
  category      text not null,
  tags          text[] not null default '{}',
  alt           text,
  note          text,
  status        text not null default 'published' check (status in ('draft','scheduled','published','removed')),
  visibility    text not null default 'public'   check (visibility in ('public','members','private')),
  published_at  timestamptz default now(),         -- future value => scheduled
  is_premium    boolean not null default false,
  unlock_tier_id uuid,                              -- FK added after tiers exist
  base_likes    int not null default 0,
  like_count    int not null default 0,
  comment_count int not null default 0,
  view_count    int not null default 0,
  weeks         int not null default 0,
  sort          int not null default 0,
  search        tsvector,                          -- maintained by trigger (below)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index if not exists artworks_user_idx     on public.artworks (user_id);
create index if not exists artworks_feed_idx     on public.artworks (status, visibility, published_at desc);
create index if not exists artworks_category_idx on public.artworks (category);
create index if not exists artworks_tags_idx     on public.artworks using gin (tags);
create index if not exists artworks_search_idx   on public.artworks using gin (search);
-- maintain the search vector (+ updated_at) on write. A trigger sidesteps the
-- immutability rule that blocks to_tsvector() inside a generated column.
create or replace function public.artworks_before_write()
returns trigger language plpgsql as $$
begin
  new.search := to_tsvector('english',
    coalesce(new.title,'') || ' ' || coalesce(new.note,'') || ' ' ||
    coalesce(array_to_string(new.tags, ' '), ''));
  if (tg_op = 'UPDATE') then new.updated_at := now(); end if;
  return new;
end; $$;
drop trigger if exists trg_artworks_touch on public.artworks;
drop trigger if exists trg_artworks_write on public.artworks;
create trigger trg_artworks_write before insert or update on public.artworks
  for each row execute function public.artworks_before_write();

-- ============================================================
--  artwork_views: raw view events -> trending / analytics / unique visitors
-- ============================================================
create table if not exists public.artwork_views (
  id         uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references public.artworks(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete set null,
  ip_hash    text,                                  -- hashed, for anon uniqueness (never raw IP)
  created_at timestamptz not null default now()
);
create index if not exists artwork_views_art_idx  on public.artwork_views (artwork_id, created_at desc);
create index if not exists artwork_views_time_idx on public.artwork_views (created_at desc);

create or replace function public.bump_view_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.artworks set view_count = view_count + 1 where id = new.artwork_id;
  return null;
end; $$;
drop trigger if exists trg_view_count on public.artwork_views;
create trigger trg_view_count after insert on public.artwork_views
  for each row execute function public.bump_view_count();

-- ============================================================
--  comments on artworks (threaded)
-- ============================================================
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references public.artworks(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete set null,
  parent_id  uuid references public.comments(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists comments_artwork_idx on public.comments (artwork_id);
create index if not exists comments_user_idx    on public.comments (user_id);
drop trigger if exists trg_comments_touch on public.comments;
create trigger trg_comments_touch before update on public.comments
  for each row execute function public.touch_updated_at();

create or replace function public.bump_comment_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.artworks set comment_count = comment_count + 1 where id = new.artwork_id;
  elsif (tg_op = 'DELETE') then
    update public.artworks set comment_count = greatest(comment_count - 1, 0) where id = old.artwork_id;
  end if;
  return null;
end; $$;
drop trigger if exists trg_comment_count on public.comments;
create trigger trg_comment_count after insert or delete on public.comments
  for each row execute function public.bump_comment_count();

-- ============================================================
--  artist membership tiers (money in MINOR UNITS)
-- ============================================================
create table if not exists public.tiers (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid not null references public.profiles(id) on delete cascade,
  tier_key    text not null,
  name        text not null,
  price_cents int  not null,
  currency    text not null default 'usd',
  blurb       text,
  perks       text[] not null default '{}',
  featured    boolean not null default false,
  cta         text,
  sort        int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (artist_id, tier_key)
);
create index if not exists tiers_artist_idx on public.tiers (artist_id);
drop trigger if exists trg_tiers_touch on public.tiers;
create trigger trg_tiers_touch before update on public.tiers
  for each row execute function public.touch_updated_at();

-- now that tiers exists, wire the artworks premium-unlock FK (idempotent)
alter table public.artworks drop constraint if exists artworks_unlock_tier_fk;
alter table public.artworks add constraint artworks_unlock_tier_fk
  foreign key (unlock_tier_id) references public.tiers(id) on delete set null;

-- ============================================================
--  memberships (subscription). Payment-provider ready.
-- ============================================================
create table if not exists public.memberships (
  subscriber_id      uuid not null references public.profiles(id) on delete cascade,
  artist_id          uuid not null references public.profiles(id) on delete cascade,
  tier_id            uuid not null references public.tiers(id)     on delete cascade,
  status             text not null default 'active',   -- active | canceled | past_due
  provider           text,                             -- 'stripe' | 'paddle' | ...
  provider_ref       text,                             -- provider subscription id
  current_period_end timestamptz,
  cancel_at          timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  primary key (subscriber_id, artist_id)
);
create index if not exists memberships_artist_idx on public.memberships (artist_id);
create index if not exists memberships_tier_idx   on public.memberships (tier_id);
drop trigger if exists trg_memberships_touch on public.memberships;
create trigger trg_memberships_touch before update on public.memberships
  for each row execute function public.touch_updated_at();

-- maintain profiles.member_count as members join/leave/change status.
-- DELTA-BASED (±1): preserves the seeded demo supporter numbers as a base.
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
      if (old.status = 'active' and new.status is distinct from 'active') then
        update public.profiles set member_count = greatest(member_count - 1, 0) where id = new.artist_id;
      elsif (old.status is distinct from 'active' and new.status = 'active') then
        update public.profiles set member_count = member_count + 1 where id = new.artist_id;
      end if;
    else
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

-- ============================================================
--  per-user library: favourites (saved) + artwork likes
-- ============================================================
create table if not exists public.favourites (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  artwork_id uuid not null references public.artworks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, artwork_id)
);
create index if not exists favourites_artwork_idx on public.favourites (artwork_id);

create table if not exists public.artwork_likes (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  artwork_id uuid not null references public.artworks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, artwork_id)
);
create index if not exists artwork_likes_artwork_idx on public.artwork_likes (artwork_id);

create or replace function public.bump_like_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.artworks set like_count = like_count + 1 where id = new.artwork_id;
  elsif (tg_op = 'DELETE') then
    update public.artworks set like_count = greatest(like_count - 1, 0) where id = old.artwork_id;
  end if;
  return null;
end; $$;
drop trigger if exists trg_like_count on public.artwork_likes;
create trigger trg_like_count after insert or delete on public.artwork_likes
  for each row execute function public.bump_like_count();

-- ============================================================
--  community forum
-- ============================================================
create table if not exists public.threads (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique,
  section    text not null,
  title      text not null,
  author     text,
  pinned     boolean not null default false,
  preview    text,
  sort       int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.threads(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  author_name text not null,
  body        text not null,
  like_count  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index if not exists posts_thread_idx on public.posts (thread_id);
drop trigger if exists trg_posts_touch on public.posts;
create trigger trg_posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

create table if not exists public.post_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id)     on delete cascade,
  primary key (user_id, post_id)
);
create index if not exists post_likes_post_idx on public.post_likes (post_id);

create or replace function public.bump_post_like_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update public.posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end; $$;
drop trigger if exists trg_post_like_count on public.post_likes;
create trigger trg_post_like_count after insert or delete on public.post_likes
  for each row execute function public.bump_post_like_count();

-- ============================================================
--  notifications
-- ============================================================
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,  -- recipient
  actor_id   uuid references public.profiles(id) on delete set null,          -- who caused it
  type       text not null,                     -- 'follow' | 'like' | 'comment' | 'membership' | ...
  artwork_id uuid references public.artworks(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  data       jsonb not null default '{}',
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notif_user_idx   on public.notifications (user_id, created_at desc);
create index if not exists notif_unread_idx on public.notifications (user_id) where read_at is null;

-- ============================================================
--  safety: blocks, reports, audit log
-- ============================================================
create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists blocks_blocked_idx on public.blocks (blocked_id);

create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('artwork','comment','profile','post')),
  target_id   uuid not null,                    -- polymorphic (no FK)
  reason      text not null,
  details     text,
  status      text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists reports_status_idx on public.reports (status, created_at desc);
create index if not exists reports_target_idx on public.reports (target_type, target_id);

create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id) on delete set null,  -- the moderator/admin
  action      text not null,                    -- 'remove_artwork' | 'ban_user' | ...
  target_type text,
  target_id   uuid,
  details     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index if not exists audit_target_idx on public.audit_log (target_type, target_id);
create index if not exists audit_time_idx   on public.audit_log (created_at desc);

-- ============================================================
--  Row-Level Security
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.follows       enable row level security;
alter table public.artworks      enable row level security;
alter table public.artwork_views enable row level security;
alter table public.comments      enable row level security;
alter table public.tiers         enable row level security;
alter table public.memberships   enable row level security;
alter table public.favourites    enable row level security;
alter table public.artwork_likes enable row level security;
alter table public.threads       enable row level security;
alter table public.posts         enable row level security;
alter table public.post_likes    enable row level security;
alter table public.notifications enable row level security;
alter table public.blocks        enable row level security;
alter table public.reports       enable row level security;
alter table public.audit_log     enable row level security;

-- public reads
drop policy if exists p_read_profiles  on public.profiles;      create policy p_read_profiles  on public.profiles      for select using (true);
drop policy if exists p_read_follows   on public.follows;       create policy p_read_follows   on public.follows       for select using (true);
drop policy if exists p_read_tiers     on public.tiers;         create policy p_read_tiers     on public.tiers         for select using (true);
drop policy if exists p_read_threads   on public.threads;       create policy p_read_threads   on public.threads       for select using (true);
drop policy if exists p_read_posts     on public.posts;         create policy p_read_posts     on public.posts         for select using (deleted_at is null);
-- comments are visible only when the parent artwork is visible to you
-- (the sub-select is filtered by the artworks RLS policy above)
drop policy if exists p_read_comments  on public.comments;      create policy p_read_comments  on public.comments      for select using (deleted_at is null and exists (select 1 from public.artworks a where a.id = artwork_id));
-- likes: you see only your own rows. Public counts come from the denormalized
-- like_count columns (artworks.like_count / posts.like_count), not the graph.
drop policy if exists p_read_artlikes  on public.artwork_likes; create policy p_read_artlikes  on public.artwork_likes for select using (auth.uid() = user_id);
drop policy if exists p_read_postlikes on public.post_likes;    create policy p_read_postlikes on public.post_likes    for select using (auth.uid() = user_id);

-- artworks: public sees published+public+live; active members of an artist's
-- tiers also see that artist's members-only works; owners see all their own;
-- staff see all
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

-- profiles: manage your own
drop policy if exists p_ins_profile on public.profiles; create policy p_ins_profile on public.profiles for insert with check (auth.uid() = id);
drop policy if exists p_upd_profile on public.profiles; create policy p_upd_profile on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- follows: manage your own edges
drop policy if exists p_own_follows on public.follows; create policy p_own_follows on public.follows for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

-- artworks: creator manages own
drop policy if exists p_ins_art on public.artworks; create policy p_ins_art on public.artworks for insert with check (auth.uid() = user_id);
drop policy if exists p_upd_art on public.artworks; create policy p_upd_art on public.artworks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists p_del_art on public.artworks; create policy p_del_art on public.artworks for delete using (auth.uid() = user_id);

-- artwork_views: anyone may record a view (own uid or anon); reads = owner or staff
drop policy if exists p_ins_view  on public.artwork_views; create policy p_ins_view  on public.artwork_views for insert with check (user_id is null or auth.uid() = user_id);
drop policy if exists p_read_view on public.artwork_views; create policy p_read_view on public.artwork_views for select using (
  public.is_staff() or exists (select 1 from public.artworks a where a.id = artwork_id and a.user_id = auth.uid())
);

-- comments: post as yourself; edit/delete own
drop policy if exists p_ins_comment on public.comments; create policy p_ins_comment on public.comments for insert with check (auth.uid() = user_id);
drop policy if exists p_upd_comment on public.comments; create policy p_upd_comment on public.comments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists p_del_comment on public.comments; create policy p_del_comment on public.comments for delete using (auth.uid() = user_id);

-- tiers: the artist manages own
drop policy if exists p_own_tiers on public.tiers; create policy p_own_tiers on public.tiers for all using (auth.uid() = artist_id) with check (auth.uid() = artist_id);

-- memberships / favourites / likes: each user owns their rows
drop policy if exists p_own_memberships on public.memberships;   create policy p_own_memberships on public.memberships   for all using (auth.uid() = subscriber_id) with check (auth.uid() = subscriber_id);
drop policy if exists p_own_favs        on public.favourites;    create policy p_own_favs        on public.favourites    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists p_own_artlikes_w  on public.artwork_likes; create policy p_own_artlikes_w  on public.artwork_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists p_own_postlikes_w on public.post_likes;    create policy p_own_postlikes_w on public.post_likes    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- posts
drop policy if exists p_ins_post on public.posts; create policy p_ins_post on public.posts for insert with check (auth.uid() = user_id);
drop policy if exists p_upd_post on public.posts; create policy p_upd_post on public.posts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists p_del_post on public.posts; create policy p_del_post on public.posts for delete using (auth.uid() = user_id);

-- notifications: recipient reads / marks read. Inserts come from server/definer only.
drop policy if exists p_read_notif on public.notifications; create policy p_read_notif on public.notifications for select using (auth.uid() = user_id);
drop policy if exists p_upd_notif  on public.notifications; create policy p_upd_notif  on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- blocks: manage your own
drop policy if exists p_own_blocks on public.blocks; create policy p_own_blocks on public.blocks for all using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

-- reports: reporter files + sees own; staff see/resolve all
drop policy if exists p_ins_report  on public.reports; create policy p_ins_report  on public.reports for insert with check (auth.uid() = reporter_id);
drop policy if exists p_read_report on public.reports; create policy p_read_report on public.reports for select using (auth.uid() = reporter_id or public.is_staff());
drop policy if exists p_upd_report  on public.reports; create policy p_upd_report  on public.reports for update using (public.is_staff()) with check (public.is_staff());

-- audit log: staff only
drop policy if exists p_read_audit on public.audit_log; create policy p_read_audit on public.audit_log for select using (public.is_staff());
drop policy if exists p_ins_audit  on public.audit_log; create policy p_ins_audit  on public.audit_log for insert with check (public.is_staff() and auth.uid() = actor_id);

-- ============================================================
--  Storage buckets  (files organised as <uid>/<file>)
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('artworks', 'artworks', true),
  ('avatars',  'avatars',  true)
on conflict (id) do nothing;

do $$
declare b text;
begin
  foreach b in array array['artworks','avatars'] loop
    execute format('drop policy if exists p_%1$s_read on storage.objects', b);
    execute format($p$create policy p_%1$s_read on storage.objects for select using (bucket_id = %1$L)$p$, b);
    execute format('drop policy if exists p_%1$s_insert on storage.objects', b);
    execute format($p$create policy p_%1$s_insert on storage.objects for insert to authenticated with check (bucket_id = %1$L and (storage.foldername(name))[1] = auth.uid()::text)$p$, b);
    execute format('drop policy if exists p_%1$s_delete on storage.objects', b);
    execute format($p$create policy p_%1$s_delete on storage.objects for delete to authenticated using (bucket_id = %1$L and (storage.foldername(name))[1] = auth.uid()::text)$p$, b);
  end loop;
end $$;

-- ============================================================
--  SECURITY NOTES (intentional posture / must-do-before-feature-X)
--   * RLS is ENABLED on all 16 tables. Every "using (true)" read is a
--     deliberately public surface (profiles, follows, tiers, threads, posts,
--     published-public artworks). Everything else fails closed.
--   * members artworks are readable by owner, staff, and ACTIVE members of
--     the artist's tiers (see p_read_artworks). private stays owner+staff only.
--   * memberships allow client self-insert (free "join tier", correct for the
--     no-payment MVP). WHEN BILLING LANDS: move membership creation server-side
--     (payment webhook via service_role) and DROP the client insert, or users
--     could self-grant paid tiers.
--   * artwork_views can be inserted by anyone (own uid or anon) — view_count is
--     therefore inflatable. Add dedup/rate-limiting before trusting it for
--     payouts or trending (e.g. unique(artwork_id,user_id,day) or edge throttle).
--   * All SECURITY DEFINER functions (is_staff, handle_new_user, the counter
--     bumps) pin search_path=public, take no injectable arguments, and perform
--     only bounded ±1 updates or return the caller's own role — no abuse vector.
--     Optional hardening: revoke execute on the trigger functions from public.
-- ============================================================

-- ============================================================
--  FUTURE (additive) — build later WITHOUT restructuring the above:
--   * badges(id, key, label, icon) + user_badges(user_id, badge_id)
--   * activity_events(id, actor_id, verb, object_type, object_id, created_at)
--       — or derive the feed from follows + artworks
--   * comment_likes(user_id, comment_id)  (same pattern as artwork_likes)
--   * orders / payments(id, user_id, provider, provider_ref, amount_cents,
--       currency, status, ...)
--   * editions(id, artwork_id, edition_size, price_cents, ...)
--       + collectible_owners(id, edition_id, owner_id, serial, acquired_at)
--   * commissions(id, artist_id, client_id, brief, price_cents, status, ...)
--   * gifts(id, sender_id, recipient_id, artwork_id?, amount_cents, ...)
--   * Galera Premium billing via profiles.premium_until (already present)
-- ============================================================
