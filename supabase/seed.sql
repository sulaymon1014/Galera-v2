-- ============================================================
--  GALERA — seed data  (run AFTER schema.sql)
--  Demo artists seeded as profiles (is_artist=true) with fixed UUIDs.
--  Prices are in cents. Artworks/threads use uuid PKs + a stable slug
--  (upserts key on slug). Idempotent.
-- ============================================================

-- ---------- demo artist profiles ----------
insert into public.profiles (id,handle,name,avatar_url,cover_url,tagline,bio,statement,is_artist,follower_count,member_count) values
  ('a0000000-0000-4000-8000-000000000001', 'wlop', 'WLOP', 'assets/img/art/av1.jpg', 'assets/img/art/l04.jpg', 'Painted light & long stories', 'Digital painter and author of the long-running webcomic GhostBlade. Known for luminous rendering, jewelled detail and heroines who carry entire kingdoms in a single look. Shares full PSDs, brushes and hours-long process videos with supporters.', 'Painting light, one story at a time.', true, 843000, 12400)
on conflict (id) do update set
  handle=excluded.handle, name=excluded.name, avatar_url=excluded.avatar_url, cover_url=excluded.cover_url,
  tagline=excluded.tagline, bio=excluded.bio, statement=excluded.statement, is_artist=true,
  follower_count=excluded.follower_count, member_count=excluded.member_count;
insert into public.profiles (id,handle,name,avatar_url,cover_url,tagline,bio,statement,is_artist,follower_count,member_count) values
  ('a0000000-0000-4000-8000-000000000002', 'nocthene', 'Nocthene', 'assets/img/art/av3.jpg', 'assets/img/art/l03.jpg', 'Cinematic sci-fi & music', 'Concept artist turned illustrator, painting planets as stages and violins as spaceships. Every piece ships with a matching music playlist; supporters vote on which instrument the next heroine plays. Process videos are real-time with commentary.', 'I paint the concerts the future forgot to hold.', true, 214000, 4120)
on conflict (id) do update set
  handle=excluded.handle, name=excluded.name, avatar_url=excluded.avatar_url, cover_url=excluded.cover_url,
  tagline=excluded.tagline, bio=excluded.bio, statement=excluded.statement, is_artist=true,
  follower_count=excluded.follower_count, member_count=excluded.member_count;
insert into public.profiles (id,handle,name,avatar_url,cover_url,tagline,bio,statement,is_artist,follower_count,member_count) values
  ('a0000000-0000-4000-8000-000000000003', 'aurelith', 'Aurelith', 'assets/img/art/av2.jpg', 'assets/img/art/l08.jpg', 'Dark opulence & thrones', 'Painter of crowns, relics and the people condemned to wear them. Renders metal the slow way — no photo textures, every reflection placed by hand. Supporters get layered PSDs, the custom gold-leaf brush set, and a monthly jewellery-rendering masterclass.', 'Gold behaves badly in the dark. That is why I paint it.', true, 158000, 2860)
on conflict (id) do update set
  handle=excluded.handle, name=excluded.name, avatar_url=excluded.avatar_url, cover_url=excluded.cover_url,
  tagline=excluded.tagline, bio=excluded.bio, statement=excluded.statement, is_artist=true,
  follower_count=excluded.follower_count, member_count=excluded.member_count;
insert into public.profiles (id,handle,name,avatar_url,cover_url,tagline,bio,statement,is_artist,follower_count,member_count) values
  ('a0000000-0000-4000-8000-000000000004', 'selune', 'Selune', 'assets/img/art/av4.jpg', 'assets/img/art/l05.jpg', 'Soft light & quiet stories', 'Illustrator of gentle scenes on the edge of the fantastic — swans in libraries, festivals seen from balconies, the last light on a city of spires. Posts a finished piece every other Friday and a sketchbook page every day, without exception, since 2022.', 'Not every painting needs a battle. Some just need a window.', true, 96000, 1540)
on conflict (id) do update set
  handle=excluded.handle, name=excluded.name, avatar_url=excluded.avatar_url, cover_url=excluded.cover_url,
  tagline=excluded.tagline, bio=excluded.bio, statement=excluded.statement, is_artist=true,
  follower_count=excluded.follower_count, member_count=excluded.member_count;

-- ---------- artist membership tiers (price_cents) ----------
insert into public.tiers (artist_id,tier_key,name,price_cents,currency,blurb,perks,featured,cta,sort) values
  ('a0000000-0000-4000-8000-000000000001', 'reader', 'Reader', 800, 'usd', 'Follow the work up close.', ARRAY['Supporter-only feed & WIPs', 'HD wallpapers of every piece', 'GhostBlade pages a week early']::text[], false, null, 0)
on conflict (artist_id,tier_key) do update set
  name=excluded.name, price_cents=excluded.price_cents, currency=excluded.currency, blurb=excluded.blurb,
  perks=excluded.perks, featured=excluded.featured, cta=excluded.cta, sort=excluded.sort;
insert into public.tiers (artist_id,tier_key,name,price_cents,currency,blurb,perks,featured,cta,sort) values
  ('a0000000-0000-4000-8000-000000000001', 'apprentice', 'Apprentice', 1800, 'usd', 'Learn how the light is made.', ARRAY['Everything in Reader', '4K downloads + layered PSDs', 'Hours-long narrated process videos', 'My full brush set']::text[], true, 'Enter the studio', 1)
on conflict (artist_id,tier_key) do update set
  name=excluded.name, price_cents=excluded.price_cents, currency=excluded.currency, blurb=excluded.blurb,
  perks=excluded.perks, featured=excluded.featured, cta=excluded.cta, sort=excluded.sort;
insert into public.tiers (artist_id,tier_key,name,price_cents,currency,blurb,perks,featured,cta,sort) values
  ('a0000000-0000-4000-8000-000000000001', 'circle', 'Ghostblade Circle', 3500, 'usd', 'Sit at the drawing table.', ARRAY['Everything in Apprentice', 'Monthly live paint-along', 'Vote on where the story goes', 'Your name in the credits']::text[], false, null, 2)
on conflict (artist_id,tier_key) do update set
  name=excluded.name, price_cents=excluded.price_cents, currency=excluded.currency, blurb=excluded.blurb,
  perks=excluded.perks, featured=excluded.featured, cta=excluded.cta, sort=excluded.sort;
insert into public.tiers (artist_id,tier_key,name,price_cents,currency,blurb,perks,featured,cta,sort) values
  ('a0000000-0000-4000-8000-000000000001', 'patron', 'Patron', 8000, 'usd', 'For the deeply invested.', ARRAY['Everything in the Circle', 'A monthly personal art critique', 'First refusal on original sketches']::text[], false, 'Become a patron', 3)
on conflict (artist_id,tier_key) do update set
  name=excluded.name, price_cents=excluded.price_cents, currency=excluded.currency, blurb=excluded.blurb,
  perks=excluded.perks, featured=excluded.featured, cta=excluded.cta, sort=excluded.sort;
insert into public.tiers (artist_id,tier_key,name,price_cents,currency,blurb,perks,featured,cta,sort) values
  ('a0000000-0000-4000-8000-000000000002', 'passenger', 'Passenger', 500, 'usd', 'Come along for the ride.', ARRAY['Supporter-only feed & WIPs', 'HD downloads', 'The matching playlist for every piece']::text[], false, null, 0)
on conflict (artist_id,tier_key) do update set
  name=excluded.name, price_cents=excluded.price_cents, currency=excluded.currency, blurb=excluded.blurb,
  perks=excluded.perks, featured=excluded.featured, cta=excluded.cta, sort=excluded.sort;
insert into public.tiers (artist_id,tier_key,name,price_cents,currency,blurb,perks,featured,cta,sort) values
  ('a0000000-0000-4000-8000-000000000002', 'copilot', 'Co-pilot', 1200, 'usd', 'Help steer the next scene.', ARRAY['Everything in Passenger', '4K downloads + layered PSDs', 'Real-time process videos with commentary', 'Vote on the next heroine’s instrument']::text[], true, 'Take the controls', 1)
on conflict (artist_id,tier_key) do update set
  name=excluded.name, price_cents=excluded.price_cents, currency=excluded.currency, blurb=excluded.blurb,
  perks=excluded.perks, featured=excluded.featured, cta=excluded.cta, sort=excluded.sort;
insert into public.tiers (artist_id,tier_key,name,price_cents,currency,blurb,perks,featured,cta,sort) values
  ('a0000000-0000-4000-8000-000000000002', 'composer', 'Composer', 2500, 'usd', 'Score the whole thing.', ARRAY['Everything in Co-pilot', 'Project files + music stems', 'Monthly livestream & Q&A', 'Your name in the credits']::text[], false, null, 2)
on conflict (artist_id,tier_key) do update set
  name=excluded.name, price_cents=excluded.price_cents, currency=excluded.currency, blurb=excluded.blurb,
  perks=excluded.perks, featured=excluded.featured, cta=excluded.cta, sort=excluded.sort;
insert into public.tiers (artist_id,tier_key,name,price_cents,currency,blurb,perks,featured,cta,sort) values
  ('a0000000-0000-4000-8000-000000000003', 'courtier', 'Courtier', 600, 'usd', 'Stand in the gilded hall.', ARRAY['Supporter-only feed & WIPs', 'HD downloads', 'Gilded work-in-progress shots']::text[], false, null, 0)
on conflict (artist_id,tier_key) do update set
  name=excluded.name, price_cents=excluded.price_cents, currency=excluded.currency, blurb=excluded.blurb,
  perks=excluded.perks, featured=excluded.featured, cta=excluded.cta, sort=excluded.sort;
insert into public.tiers (artist_id,tier_key,name,price_cents,currency,blurb,perks,featured,cta,sort) values
  ('a0000000-0000-4000-8000-000000000003', 'goldsmith', 'Goldsmith', 1500, 'usd', 'Render metal the slow way.', ARRAY['Everything in Courtier', '4K downloads + layered PSDs', 'My custom gold-leaf brush set', 'Monthly jewellery-rendering masterclass']::text[], true, 'Learn the gold', 1)
on conflict (artist_id,tier_key) do update set
  name=excluded.name, price_cents=excluded.price_cents, currency=excluded.currency, blurb=excluded.blurb,
  perks=excluded.perks, featured=excluded.featured, cta=excluded.cta, sort=excluded.sort;
insert into public.tiers (artist_id,tier_key,name,price_cents,currency,blurb,perks,featured,cta,sort) values
  ('a0000000-0000-4000-8000-000000000003', 'regent', 'Regent', 3000, 'usd', 'Command the next relic.', ARRAY['Everything in Goldsmith', 'Monthly live critique', 'Vote on the next crown or relic', 'Your name in the credits']::text[], false, null, 2)
on conflict (artist_id,tier_key) do update set
  name=excluded.name, price_cents=excluded.price_cents, currency=excluded.currency, blurb=excluded.blurb,
  perks=excluded.perks, featured=excluded.featured, cta=excluded.cta, sort=excluded.sort;
insert into public.tiers (artist_id,tier_key,name,price_cents,currency,blurb,perks,featured,cta,sort) values
  ('a0000000-0000-4000-8000-000000000004', 'daydreamer', 'Daydreamer', 400, 'usd', 'A quiet page every day.', ARRAY['The daily sketchbook feed', 'Supporter-only WIPs', 'HD downloads of every piece']::text[], false, 'Follow the sketchbook', 0)
on conflict (artist_id,tier_key) do update set
  name=excluded.name, price_cents=excluded.price_cents, currency=excluded.currency, blurb=excluded.blurb,
  perks=excluded.perks, featured=excluded.featured, cta=excluded.cta, sort=excluded.sort;
insert into public.tiers (artist_id,tier_key,name,price_cents,currency,blurb,perks,featured,cta,sort) values
  ('a0000000-0000-4000-8000-000000000004', 'lamplighter', 'Lamplighter', 1000, 'usd', 'Light the whole city.', ARRAY['Everything in Daydreamer', '4K downloads + layered PSDs', 'Every-other-Friday process videos', 'A printed postcard mailed monthly + your name in the credits']::text[], true, null, 1)
on conflict (artist_id,tier_key) do update set
  name=excluded.name, price_cents=excluded.price_cents, currency=excluded.currency, blurb=excluded.blurb,
  perks=excluded.perks, featured=excluded.featured, cta=excluded.cta, sort=excluded.sort;

-- ---------- artworks (slug = deep-link id) ----------
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('w-blossom', 'a0000000-0000-4000-8000-000000000001', 'assets/img/art/l01.jpg', 'Beneath the Blossoms', 'Portrait', true, 48200, 1, 'Girl in red with braided hair among plum blossom branches against a deep red wall', 'A study in red on red — plum blossoms painted petal by petal over a two-week stream series.', 0)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('w-coronation', 'a0000000-0000-4000-8000-000000000001', 'assets/img/art/p08.jpg', 'Coronation', 'Fantasy', true, 61300, 3, 'Queen in silver dress holding a great sword in a crowded cathedral, halo breaking above her', 'From the GhostBlade chapter finale. The halo is painted breaking apart — crowns cost something.', 1)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('w-scarlet-veil', 'a0000000-0000-4000-8000-000000000001', 'assets/img/art/p09.jpg', 'Scarlet Veil', 'Portrait', false, 57800, 5, 'Portrait of a green-eyed heroine with a jewelled veil of chains and butterfly-wing earrings', 'Every chain link in the veil is hand-placed. Supporters get the 40-minute jewellery rendering breakdown.', 2)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('w-candlelight', 'a0000000-0000-4000-8000-000000000001', 'assets/img/art/p10.jpg', 'By the Window', 'Portrait', false, 39400, 7, 'Woman in a black evening dress leaning against a bright window in a firelit hall', 'One light source, one figure, one held breath. Painted as a values exercise that refused to stay one.', 3)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('w-first-market', 'a0000000-0000-4000-8000-000000000001', 'assets/img/art/l04.jpg', 'First Market of Spring', 'Story', true, 44900, 9, 'Girl in festival dress buying candied fruit under hundreds of red lanterns, a small dog begging below', 'New year market from the GhostBlade world — and yes, the dog gets the candied fruit in the next panel.', 4)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('w-monarch', 'a0000000-0000-4000-8000-000000000001', 'assets/img/art/p06.jpg', 'Monarch', 'Fantasy', false, 42600, 11, 'Seated figure in a black butterfly-patterned cloak among jewelled mannequins', 'The cloak borrows the wing pattern of a monarch butterfly; the mannequins wear the rejected designs.', 5)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('w-red-standard', 'a0000000-0000-4000-8000-000000000001', 'assets/img/art/l09.jpg', 'The Red Standard', 'Portrait', false, 36100, 13, 'Wind-blown portrait with a red banner, jewelled face chain and a golden lion pauldron', 'Painted in a single weekend for the anniversary stream. The wind arrived somewhere around hour six.', 6)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('w-dragon-festival', 'a0000000-0000-4000-8000-000000000001', 'assets/img/art/l13.jpg', 'Festival of the Paper Dragon', 'Scenery', true, 51200, 15, 'A serpentine dragon winding through misty rooftops as children watch from a balcony strewn with red charms', 'The dragon is one continuous brushstroke, redrawn forty times until it moved like paper in wind.', 7)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('n-orbital-ride', 'a0000000-0000-4000-8000-000000000002', 'assets/img/art/l02.jpg', 'Orbital Ride', 'Sci-Fi', true, 28700, 2, 'Girl seated on a neon-wheeled motorcycle parked on a mirror floor above a glowing Earth at night', 'The bike is parked. That is the whole point — some machines exist for the view, not the ride.', 8)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('n-nocturne', 'a0000000-0000-4000-8000-000000000002', 'assets/img/art/l03.jpg', 'Nocturne for a Planet', 'Sci-Fi', false, 31500, 4, 'Violinist playing above the glowing night side of Earth, city lights tracing the coastlines', 'City lights become the sheet music. Painted to Saint-Saëns No. 3 on repeat for eleven days.', 9)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('n-overture', 'a0000000-0000-4000-8000-000000000002', 'assets/img/art/l06.jpg', 'Overture at the Edge', 'Sci-Fi', false, 26400, 6, 'Violinist in a black dress standing on a rooftop ledge before a vast glowing planet', 'Companion piece to Nocturne — the same concert, seen by the only member of the audience.', 10)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('n-clockwork', 'a0000000-0000-4000-8000-000000000002', 'assets/img/art/l11.jpg', 'Clockwork Sonata', 'Portrait', true, 33800, 8, 'Violinist in the dark playing a brass clockwork violin that scatters sparks', 'The violin runs. Supporters get the mechanical turnaround showing every gear that would actually turn.', 11)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('n-departure', 'a0000000-0000-4000-8000-000000000002', 'assets/img/art/p04.jpg', 'Departure', 'Story', false, 24100, 10, 'Small girl with crutches at a rain-streaked terminal window, watching a giant airship dock', 'The quietest piece in the series. She is not sad — she is memorising the hull number.', 12)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('a-gilded-hour', 'a0000000-0000-4000-8000-000000000003', 'assets/img/art/p02.jpg', 'The Gilded Hour', 'Fantasy', false, 22300, 2, 'Queen resting on an ornate golden throne beside a molten lion sculpture, night behind the columns', 'Gold rendered entirely by hand — no photo textures, three weeks of placing reflections one by one.', 13)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('a-quiet-crown', 'a0000000-0000-4000-8000-000000000003', 'assets/img/art/p03.jpg', 'The Quiet Crown', 'Portrait', false, 19800, 4, 'Crowned woman in a black gown with gold embroidery standing at a painted table', 'A queen at the hour when the court has gone home and the crown is just a heavy hat.', 14)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('a-death-answered', 'a0000000-0000-4000-8000-000000000003', 'assets/img/art/p05.jpg', 'And Death Answered', 'Fantasy', true, 27600, 6, 'Bride in white reaching up to a veiled skeletal figure crowned with a golden halo, skulls below', 'The bargain scene from an unwritten book. She is not begging — look again at whose hand leads.', 15)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('a-horologist', 'a0000000-0000-4000-8000-000000000003', 'assets/img/art/l07.jpg', 'The Horologist', 'Portrait', true, 21500, 8, 'Woman surrounded by floating astrolabes, jewelled chains and glass orbs, resting her chin on one hand', 'Time as jewellery. Every instrument in the frame keeps a different, equally wrong hour.', 16)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('a-regalia', 'a0000000-0000-4000-8000-000000000003', 'assets/img/art/l08.jpg', 'Regalia', 'Fantasy', false, 25900, 10, 'Queen on a vast engraved golden throne, one hand on a gilded skull, black silk pooling at her feet', 'The throne took longer than the figure. Thrones usually do — that is their entire strategy.', 17)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('s-swan-library', 'a0000000-0000-4000-8000-000000000004', 'assets/img/art/l05.jpg', 'The Swan Library', 'Story', false, 18400, 1, 'Woman reading sheet music on the rim of a marble fountain, surrounded by seven attentive swans', 'The swans are not decoration; they are the choir, and they are waiting for their cue.', 18)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('s-cathedral', 'a0000000-0000-4000-8000-000000000004', 'assets/img/art/l12.jpg', 'Cathedral of Swans', 'Fantasy', true, 20700, 3, 'Silver-haired elf in a navy gown seated on cathedral steps as swans court around her', 'Painted after a real morning at the cathedral pond. The elf ears arrived without permission.', 19)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('s-trial', 'a0000000-0000-4000-8000-000000000004', 'assets/img/art/l10.jpg', 'The Trial of the White Lion', 'Fantasy', false, 23200, 5, 'Small figure in a white cape standing calm before a colossal roaring white lion in an arena of petals', 'The arena expects a fight. She brought patience instead. The petals are on her side.', 20)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('s-sundown', 'a0000000-0000-4000-8000-000000000004', 'assets/img/art/p07.jpg', 'Sundown Companion', 'Fantasy', false, 19600, 7, 'Girl with a dragon-mask pauldron resting her forehead against a lion’s mane at burnt-orange sunset', 'Some friendships require no dialogue. Painted warm on purpose; the world is orange when you are safe.', 21)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('s-lamplighter', 'a0000000-0000-4000-8000-000000000004', 'assets/img/art/l14.jpg', 'The Lamplighter', 'Scenery', false, 17300, 9, 'Woman with a glowing brush overlooking a dusk city of spires and warm windows', 'She lights the city one window at a time with a paintbrush. A self-portrait, in the honest sense.', 22)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;
insert into public.artworks (slug,user_id,image_path,title,category,is_premium,base_likes,weeks,alt,note,sort) values
  ('s-tailwind', 'a0000000-0000-4000-8000-000000000004', 'assets/img/art/p01.jpg', 'Tailwind', 'Story', false, 21900, 11, 'Boy cycling along a canal at sunset with a girl in headphones riding side-saddle behind him', 'The whole story is in the reflection: the water gets the version they will both remember.', 23)
on conflict (slug) do update set
  user_id=excluded.user_id, image_path=excluded.image_path, title=excluded.title, category=excluded.category,
  is_premium=excluded.is_premium, base_likes=excluded.base_likes, weeks=excluded.weeks,
  alt=excluded.alt, note=excluded.note, sort=excluded.sort;

-- ---------- forum threads (slug) ----------
insert into public.threads (slug,section,title,author,pinned,preview,sort) values
  ('t-wip', 'Works in Progress', 'Weekly WIP thread — post what’s on your canvas', 'Galera Team', true, 'The rules are unchanged and sacred: post the ugly middle stage, say what’s fighting you, no apologising for unfinished work…', 0)
on conflict (slug) do update set
  section=excluded.section, title=excluded.title, author=excluded.author,
  pinned=excluded.pinned, preview=excluded.preview, sort=excluded.sort;
insert into public.threads (slug,section,title,author,pinned,preview,sort) values
  ('t-tablet', 'Tools & Software', 'Which tablet for a beginner in 2026 — honest answers', 'Aya M.', false, 'Budget is around $400. Screen tablet or classic? Everyone online is sponsored and I trust this room more…', 1)
on conflict (slug) do update set
  section=excluded.section, title=excluded.title, author=excluded.author,
  pinned=excluded.pinned, preview=excluded.preview, sort=excluded.sort;
insert into public.threads (slug,section,title,author,pinned,preview,sort) values
  ('t-critique', 'Critique Lounge', '[Critique] Lighting study — where does the focus die?', 'Jonas W.', false, 'Night market scene, three light sources. Something in the middle distance is eating the composition and I’m too close to see it…', 2)
on conflict (slug) do update set
  section=excluded.section, title=excluded.title, author=excluded.author,
  pinned=excluded.pinned, preview=excluded.preview, sort=excluded.sort;
insert into public.threads (slug,section,title,author,pinned,preview,sort) values
  ('t-process', 'Process & Learning', 'Nocthene’s clockwork violin process video is a masterclass', 'Camille R.', false, 'Three hours, real-time, with commentary — and the part where the whole mechanism gets rebuilt at hour two is the most honest thing on this platform…', 3)
on conflict (slug) do update set
  section=excluded.section, title=excluded.title, author=excluded.author,
  pinned=excluded.pinned, preview=excluded.preview, sort=excluded.sort;
insert into public.threads (slug,section,title,author,pinned,preview,sort) values
  ('t-welcome', 'General Discussion', 'Introduce yourself — July thread', 'Galera Team', false, 'New here? Two questions, house tradition: the first digital artwork that stopped you cold, and what you’re here for — supporting, learning, or posting…', 4)
on conflict (slug) do update set
  section=excluded.section, title=excluded.title, author=excluded.author,
  pinned=excluded.pinned, preview=excluded.preview, sort=excluded.sort;
insert into public.threads (slug,section,title,author,pinned,preview,sort) values
  ('t-payout', 'Support Q&A', 'How do artist payouts and the platform fee work?', 'New Member', false, 'Before I subscribe to two artists — how much of my pledge actually reaches them, and when?', 5)
on conflict (slug) do update set
  section=excluded.section, title=excluded.title, author=excluded.author,
  pinned=excluded.pinned, preview=excluded.preview, sort=excluded.sort;

-- ---------- seed posts (resolve thread by slug; insert once) ----------
insert into public.posts (thread_id,user_id,author_name,body)
  select th.id, null, 'Galera Team', 'The rules are unchanged and sacred: post the ugly middle stage, say what’s fighting you, and no apologising for unfinished work. The middle stage is the job. Go.'
  from public.threads th
  where th.slug = 't-wip'
    and not exists (select 1 from public.posts px where px.thread_id = th.id and px.author_name = 'Galera Team' and px.body = 'The rules are unchanged and sacred: post the ugly middle stage, say what’s fighting you, and no apologising for unfinished work. The middle stage is the job. Go.');
insert into public.posts (thread_id,user_id,author_name,body)
  select th.id, null, 'Jonas W.', 'Armour study, hour six. The metal reads as plastic and I have stopped being able to tell why. Suspect my reflected light is the same temperature as my key light. Verdicts welcome.'
  from public.threads th
  where th.slug = 't-wip'
    and not exists (select 1 from public.posts px where px.thread_id = th.id and px.author_name = 'Jonas W.' and px.body = 'Armour study, hour six. The metal reads as plastic and I have stopped being able to tell why. Suspect my reflected light is the same temperature as my key light. Verdicts welcome.');
insert into public.posts (thread_id,user_id,author_name,body)
  select th.id, null, 'Priya S.', '@Jonas it’s the edges, not the temperature — your highlights have soft edges everywhere and metal needs those cruel hard ones. Sharpen three of them and watch it snap into place.'
  from public.threads th
  where th.slug = 't-wip'
    and not exists (select 1 from public.posts px where px.thread_id = th.id and px.author_name = 'Priya S.' and px.body = '@Jonas it’s the edges, not the temperature — your highlights have soft edges everywhere and metal needs those cruel hard ones. Sharpen three of them and watch it snap into place.');
insert into public.posts (thread_id,user_id,author_name,body)
  select th.id, null, 'Aya M.', 'First time posting here: portrait study from the Scarlet Veil breakdown. The chains defeated me but the skin tones finally behaved. Be gentle but be honest.'
  from public.threads th
  where th.slug = 't-wip'
    and not exists (select 1 from public.posts px where px.thread_id = th.id and px.author_name = 'Aya M.' and px.body = 'First time posting here: portrait study from the Scarlet Veil breakdown. The chains defeated me but the skin tones finally behaved. Be gentle but be honest.');
insert into public.posts (thread_id,user_id,author_name,body)
  select th.id, null, 'Aya M.', 'Budget is around $400. Screen tablet or classic pad? Every review online is sponsored and I trust this room more than any of them.'
  from public.threads th
  where th.slug = 't-tablet'
    and not exists (select 1 from public.posts px where px.thread_id = th.id and px.author_name = 'Aya M.' and px.body = 'Budget is around $400. Screen tablet or classic pad? Every review online is sponsored and I trust this room more than any of them.');
insert into public.posts (thread_id,user_id,author_name,body)
  select th.id, null, 'Marcus T.', 'Unpopular truth: at $400, a good classic pad plus a colour-calibrated monitor beats a cheap screen tablet every time. Parallax on budget screens teaches bad habits.'
  from public.threads th
  where th.slug = 't-tablet'
    and not exists (select 1 from public.posts px where px.thread_id = th.id and px.author_name = 'Marcus T.' and px.body = 'Unpopular truth: at $400, a good classic pad plus a colour-calibrated monitor beats a cheap screen tablet every time. Parallax on budget screens teaches bad habits.');
insert into public.posts (thread_id,user_id,author_name,body)
  select th.id, null, 'Jonas W.', 'Seconding the pad. I painted my first 2,000 hours on one. The disconnect feels weird for two weeks, then becomes a superpower — your hand stops hiding your drawing.'
  from public.threads th
  where th.slug = 't-tablet'
    and not exists (select 1 from public.posts px where px.thread_id = th.id and px.author_name = 'Jonas W.' and px.body = 'Seconding the pad. I painted my first 2,000 hours on one. The disconnect feels weird for two weeks, then becomes a superpower — your hand stops hiding your drawing.');
insert into public.posts (thread_id,user_id,author_name,body)
  select th.id, null, 'Camille R.', 'Whatever you buy: spend the leftover on a decent chair. Nobody sponsors chairs, which is how you know it’s real advice.'
  from public.threads th
  where th.slug = 't-tablet'
    and not exists (select 1 from public.posts px where px.thread_id = th.id and px.author_name = 'Camille R.' and px.body = 'Whatever you buy: spend the leftover on a decent chair. Nobody sponsors chairs, which is how you know it’s real advice.');
insert into public.posts (thread_id,user_id,author_name,body)
  select th.id, null, 'Jonas W.', 'Night market scene, three light sources — lantern red, shop-window warm, moon cold. Something in the middle distance is eating the composition alive and I am too close to see it. Tear it apart.'
  from public.threads th
  where th.slug = 't-critique'
    and not exists (select 1 from public.posts px where px.thread_id = th.id and px.author_name = 'Jonas W.' and px.body = 'Night market scene, three light sources — lantern red, shop-window warm, moon cold. Something in the middle distance is eating the composition alive and I am too close to see it. Tear it apart.');
insert into public.posts (thread_id,user_id,author_name,body)
  select th.id, null, 'Helene D.', 'Non-painter’s eye: everything is equally loud. The lanterns, the window, the moon — all shouting. In the WLOP market piece the lanterns win and everything else agrees to lose. Pick your winner.'
  from public.threads th
  where th.slug = 't-critique'
    and not exists (select 1 from public.posts px where px.thread_id = th.id and px.author_name = 'Helene D.' and px.body = 'Non-painter’s eye: everything is equally loud. The lanterns, the window, the moon — all shouting. In the WLOP market piece the lanterns win and everything else agrees to lose. Pick your winner.');
insert into public.posts (thread_id,user_id,author_name,body)
  select th.id, null, 'Priya S.', 'Helene said it better than any tutorial. Also squint test: your value range in the middle distance is identical to the foreground. Push it back with two levels of contrast and the eye will stop snagging.'
  from public.threads th
  where th.slug = 't-critique'
    and not exists (select 1 from public.posts px where px.thread_id = th.id and px.author_name = 'Priya S.' and px.body = 'Helene said it better than any tutorial. Also squint test: your value range in the middle distance is identical to the foreground. Push it back with two levels of contrast and the eye will stop snagging.');
insert into public.posts (thread_id,user_id,author_name,body)
  select th.id, null, 'Camille R.', 'Three hours, real-time, with commentary. The part where the entire violin mechanism gets scrapped and rebuilt at hour two is the most honest thing I have watched on this platform. Studio tier paying for itself.'
  from public.threads th
  where th.slug = 't-process'
    and not exists (select 1 from public.posts px where px.thread_id = th.id and px.author_name = 'Camille R.' and px.body = 'Three hours, real-time, with commentary. The part where the entire violin mechanism gets scrapped and rebuilt at hour two is the most honest thing I have watched on this platform. Studio tier paying for itself.');
insert into public.posts (thread_id,user_id,author_name,body)
  select th.id, null, 'Marcus T.', 'The gear teeth actually mesh. I paused and checked. There is a full mechanical turnaround in the supporter post. This is what “process content” should mean.'
  from public.threads th
  where th.slug = 't-process'
    and not exists (select 1 from public.posts px where px.thread_id = th.id and px.author_name = 'Marcus T.' and px.body = 'The gear teeth actually mesh. I paused and checked. There is a full mechanical turnaround in the supporter post. This is what “process content” should mean.');
insert into public.posts (thread_id,user_id,author_name,body)
  select th.id, null, 'Aya M.', 'As a beginner the biggest lesson wasn’t technique — it was watching someone that good be uncertain for forty minutes and just keep going.'
  from public.threads th
  where th.slug = 't-process'
    and not exists (select 1 from public.posts px where px.thread_id = th.id and px.author_name = 'Aya M.' and px.body = 'As a beginner the biggest lesson wasn’t technique — it was watching someone that good be uncertain for forty minutes and just keep going.');
insert into public.posts (thread_id,user_id,author_name,body)
  select th.id, null, 'Galera Team', 'New here? Two questions, house tradition: name the first digital artwork that stopped you cold, and tell us what you’re here for — supporting, learning, posting, or all three.'
  from public.threads th
  where th.slug = 't-welcome'
    and not exists (select 1 from public.posts px where px.thread_id = th.id and px.author_name = 'Galera Team' and px.body = 'New here? Two questions, house tradition: name the first digital artwork that stopped you cold, and tell us what you’re here for — supporting, learning, posting, or all three.');
insert into public.posts (thread_id,user_id,author_name,body)
  select th.id, null, 'Helene D.', 'Stopped cold by: a GhostBlade cathedral piece, years ago, on a phone screen at 2 a.m. Here for: funding the slow versions. I don’t paint; I make paintings possible. It’s a good job.'
  from public.threads th
  where th.slug = 't-welcome'
    and not exists (select 1 from public.posts px where px.thread_id = th.id and px.author_name = 'Helene D.' and px.body = 'Stopped cold by: a GhostBlade cathedral piece, years ago, on a phone screen at 2 a.m. Here for: funding the slow versions. I don’t paint; I make paintings possible. It’s a good job.');
insert into public.posts (thread_id,user_id,author_name,body)
  select th.id, null, 'Jonas W.', 'First stopped by a tiny study of light through blinds — nothing epic, just true. Here for all three, but mostly to post the ugly middle stages until they stop being ugly.'
  from public.threads th
  where th.slug = 't-welcome'
    and not exists (select 1 from public.posts px where px.thread_id = th.id and px.author_name = 'Jonas W.' and px.body = 'First stopped by a tiny study of light through blinds — nothing epic, just true. Here for all three, but mostly to post the ugly middle stages until they stop being ugly.');
insert into public.posts (thread_id,user_id,author_name,body)
  select th.id, null, 'New Member', 'Before I subscribe to two artists: how much of my pledge actually reaches them, and when? Sorry if this is a spreadsheet question — I like spreadsheets.'
  from public.threads th
  where th.slug = 't-payout'
    and not exists (select 1 from public.posts px where px.thread_id = th.id and px.author_name = 'New Member' and px.body = 'Before I subscribe to two artists: how much of my pledge actually reaches them, and when? Sorry if this is a spreadsheet question — I like spreadsheets.');
insert into public.posts (thread_id,user_id,author_name,body)
  select th.id, null, 'Galera Team', 'Spreadsheet questions are our favourite kind. Artists keep 92% of every pledge; 8% runs the platform. Payouts land on the 1st of each month, no minimum balance, no payout fee. Refunds within 14 days are automatic and come out of our share, not the artist’s.'
  from public.threads th
  where th.slug = 't-payout'
    and not exists (select 1 from public.posts px where px.thread_id = th.id and px.author_name = 'Galera Team' and px.body = 'Spreadsheet questions are our favourite kind. Artists keep 92% of every pledge; 8% runs the platform. Payouts land on the 1st of each month, no minimum balance, no payout fee. Refunds within 14 days are automatic and come out of our share, not the artist’s.');
