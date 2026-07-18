-- ============================================================
--  Migration: auto-remove the profile when an auth user is deleted
--
--  Mirror of handle_new_user: deleting a user in Authentication → Users now
--  deletes their public.profiles row too. Existing FKs cascade from there
--  (follows, favourites, likes, memberships, artworks, blocks; comments and
--  posts keep the content but null the author). Seeded artist profiles have
--  no auth.users row, so they are unaffected.
--
--  Note: files the user uploaded to Storage are NOT removed by this trigger
--  (storage.objects is not FK'd to profiles). Orphaned files in the
--  artworks/avatars buckets can be cleaned from the Storage dashboard.
--
--  Safe to re-run. Also folded into schema.sql.
--  Run in: Supabase → SQL Editor.
-- ============================================================

create or replace function public.handle_deleted_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end; $$;

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users for each row execute function public.handle_deleted_user();
