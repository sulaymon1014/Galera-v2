-- ============================================================
--  GALERA — database schema  (run FIRST, in the Supabase SQL editor)
--  Vision: premium platform for digital artists. ONE account type;
--  any user can opt in to become an artist. MVP = free artwork uploads
--  + optional premium content gated by an artist's membership tiers.
--  Designed so future features (limited editions, commissions, gifts,
--  collectibles, Galera Premium, follows) can be added additively
--  without restructuring these tables. Safe to re-run.
-- ============================================================

-- ---------- profiles: one row per user; artists are just users with is_artist ----------
-- id is trigger-synced to auth.users for real signups. No hard FK, so demo
-- artists can be seeded without an auth account. RLS still keys off auth.uid().
create table if not exists public.profiles (
  id             uuid primary key default gen_random_uuid(),
  handle         text unique,                 -- pretty URL, e.g. 'wlop'
  name           text not null default 'Member',
  email          text,
  avatar_url     text,
  cover_url      text,                         -- artist banner
  tagline        text,                         -- short "practice" line
  bio            text,
  statement      text,
  is_artist      boolean not null default false,  -- opt-in toggle
  follower_count int not null default 0,        -- display metric (real follows: future)
  member_count   int not null default 0,        -- paying members (display metric)
  created_at     timestamptz not null default now()
);

-- auto-create a profile row whenever someone signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- artworks: uploaded by a user (the artist). Free to post. ----------
create table if not exists public.artworks (
  id         text primary key,               -- slug for seed; 'u-<uuid>' for uploads
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  image_path text not null,                  -- /assets path (seed) or storage path (uploads)
  category   text not null,
  alt        text,
  note       text,
  is_premium boolean default false,          -- seam: content gated by membership tier
  base_likes int default 0,                  -- seeded popularity; real likes add on top
  weeks      int default 0,
  sort       int default 0,
  created_at timestamptz not null default now()
);
create index if not exists artworks_user_idx on public.artworks (user_id);

-- ---------- artist membership tiers (optional premium) ----------
create table if not exists public.tiers (
  id        uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.profiles(id) on delete cascade,
  tier_key  text not null,                   -- e.g. 'reader'
  name      text not null,
  price     int  not null,
  blurb     text,
  perks     text[] not null default '{}',
  featured  boolean default false,
  cta       text,
  sort      int default 0,
  unique (artist_id, tier_key)
);

-- ---------- memberships: a user joins an artist's tier ----------
create table if not exists public.memberships (
  subscriber_id uuid not null references public.profiles(id) on delete cascade,
  artist_id     uuid not null references public.profiles(id) on delete cascade,
  tier_id       uuid not null references public.tiers(id) on delete cascade,
  created_at    timestamptz default now(),
  primary key (subscriber_id, artist_id)
);

-- ---------- per-user library ----------
create table if not exists public.favourites (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  artwork_id text not null references public.artworks(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, artwork_id)
);

create table if not exists public.artwork_likes (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  artwork_id text not null references public.artworks(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, artwork_id)
);

-- ---------- community ----------
create table if not exists public.threads (
  id         text primary key,
  section    text not null,
  title      text not null,
  author     text,
  pinned     boolean default false,
  preview    text,
  sort       int default 0,
  created_at timestamptz default now()
);

create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  thread_id   text not null references public.threads(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  author_name text not null,
  body        text not null,
  created_at  timestamptz default now()
);

create table if not exists public.post_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  primary key (user_id, post_id)
);

-- ============================================================
--  Row-Level Security
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.artworks      enable row level security;
alter table public.tiers         enable row level security;
alter table public.memberships   enable row level security;
alter table public.favourites    enable row level security;
alter table public.artwork_likes enable row level security;
alter table public.threads       enable row level security;
alter table public.posts         enable row level security;
alter table public.post_likes    enable row level security;

-- public read: profiles, catalog, community, like counts
drop policy if exists p_read_profiles  on public.profiles;      create policy p_read_profiles  on public.profiles      for select using (true);
drop policy if exists p_read_artworks  on public.artworks;      create policy p_read_artworks  on public.artworks      for select using (true);
drop policy if exists p_read_tiers     on public.tiers;         create policy p_read_tiers     on public.tiers         for select using (true);
drop policy if exists p_read_threads   on public.threads;       create policy p_read_threads   on public.threads       for select using (true);
drop policy if exists p_read_posts     on public.posts;         create policy p_read_posts     on public.posts         for select using (true);
drop policy if exists p_read_artlikes  on public.artwork_likes; create policy p_read_artlikes  on public.artwork_likes for select using (true);
drop policy if exists p_read_postlikes on public.post_likes;    create policy p_read_postlikes on public.post_likes    for select using (true);

-- profiles: manage your own (incl. flipping is_artist / editing artist fields)
drop policy if exists p_ins_profile on public.profiles; create policy p_ins_profile on public.profiles for insert with check (auth.uid() = id);
drop policy if exists p_upd_profile on public.profiles; create policy p_upd_profile on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- artworks: the creator manages their own
drop policy if exists p_ins_art on public.artworks; create policy p_ins_art on public.artworks for insert with check (auth.uid() = user_id);
drop policy if exists p_upd_art on public.artworks; create policy p_upd_art on public.artworks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists p_del_art on public.artworks; create policy p_del_art on public.artworks for delete using (auth.uid() = user_id);

-- tiers: the artist manages their own
drop policy if exists p_own_tiers on public.tiers; create policy p_own_tiers on public.tiers for all using (auth.uid() = artist_id) with check (auth.uid() = artist_id);

-- memberships / favourites / likes: each user owns their rows
drop policy if exists p_own_memberships on public.memberships;   create policy p_own_memberships on public.memberships   for all using (auth.uid() = subscriber_id) with check (auth.uid() = subscriber_id);
drop policy if exists p_own_favs        on public.favourites;    create policy p_own_favs        on public.favourites    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists p_own_artlikes_w  on public.artwork_likes; create policy p_own_artlikes_w  on public.artwork_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists p_own_postlikes_w on public.post_likes;    create policy p_own_postlikes_w on public.post_likes    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- posts: signed-in users post as themselves; edit/delete own
drop policy if exists p_ins_post on public.posts; create policy p_ins_post on public.posts for insert with check (auth.uid() = user_id);
drop policy if exists p_upd_post on public.posts; create policy p_upd_post on public.posts for update using (auth.uid() = user_id);
drop policy if exists p_del_post on public.posts; create policy p_del_post on public.posts for delete using (auth.uid() = user_id);

-- ============================================================
--  Storage bucket for uploaded artwork (files under <uid>/<file>)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('artworks', 'artworks', true)
on conflict (id) do nothing;

drop policy if exists p_art_read   on storage.objects;
create policy p_art_read on storage.objects
  for select using (bucket_id = 'artworks');

drop policy if exists p_art_insert on storage.objects;
create policy p_art_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'artworks' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists p_art_delete on storage.objects;
create policy p_art_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'artworks' and (storage.foldername(name))[1] = auth.uid()::text);
