/* ============================================================
   GALERA — catalog data
   Artists, artworks, tiers and forum threads load from Supabase into the
   same shape the pages use. Journal + reviews stay static (editorial).
   Pages await window.GALERA.ready before rendering catalog content.
   ============================================================ */
(function () {
  'use strict';

  const IMG = 'assets/img/art/';
  const IMG_PLACEHOLDER_AVATAR = 'assets/img/placeholder-avatar.svg';
  const IMG_PLACEHOLDER_COVER = 'assets/img/placeholder-cover.svg';

  /* pixel dimensions of the bundled seed files — lets frames reserve the right
     aspect ratio before the image loads (and sizes the filmstrip rows) */
  const DIMS = {
    'p01.jpg': [788, 1400], 'p02.jpg': [713, 1400], 'p03.jpg': [795, 1400], 'p04.jpg': [910, 1400],
    'p05.jpg': [840, 1400], 'p06.jpg': [753, 1400], 'p07.jpg': [762, 1400], 'p08.jpg': [835, 1400],
    'p09.jpg': [1015, 1400], 'p10.jpg': [627, 1400],
    'l01.jpg': [1600, 979], 'l02.jpg': [1600, 900], 'l03.jpg': [1600, 900], 'l04.jpg': [1600, 1000],
    'l05.jpg': [1600, 900], 'l06.jpg': [1600, 817], 'l07.jpg': [1600, 909], 'l08.jpg': [1600, 857],
    'l09.jpg': [1600, 909], 'l10.jpg': [1600, 847], 'l11.jpg': [1600, 900], 'l12.jpg': [1600, 791],
    'l13.jpg': [1600, 921], 'l14.jpg': [1600, 802]
  };
  const arOf = (img) => { const d = DIMS[String(img).split('/').pop()]; return d ? `${d[0]} / ${d[1]}` : '4 / 3'; };

  const CATEGORIES = ['Portrait', 'Fantasy', 'Sci-Fi', 'Story', 'Scenery'];

  /* ------------------------------------------------ journal (static) */
  const JOURNAL = [
    {
      id: 'pricing-guide', title: 'A Guide to Pricing Your Work',
      kicker: 'Guide', date: 'June 2026', readTime: '6 min',
      cover: IMG + 'l14.jpg',
      excerpt: 'You set the price here — the platform never does. A practical guide to pricing your tiers and commissions without underselling the ninety hours behind each piece.',
      body: [
        'The first thing to understand about pricing on Galera: it is yours to set. The platform takes no cut of what you charge beyond the flat 8% that keeps the servers running — every tier price, every commission rate, every one-off is a number you choose. That freedom is also the hard part, because most artists price from fear rather than value.',
        'Start with your tiers, not your art. A healthy page usually has three: an entry tier around the price of a coffee that buys people into your process, a middle tier — where most of your income will live — that adds files, PSDs and process videos, and a top tier for the few who want your time directly. Price the middle tier at what a month of your best work is honestly worth to someone who loves it, then set the others on either side.',
        'The math that matters is not per-person, it is per-thousand. A single small pledge is a tip; that same pledge times two thousand people is a salary, and a salary is creative freedom. This is why undercharging hurts more than it helps — a tier priced too low needs an impossible crowd to become a living, and it quietly tells your best supporters their support means less than it does.',
        'For commissions, price the hours, not the guess. Track how long a piece actually takes — sketch, revisions, render, the dead ends — and set an hourly floor you would not resent. Raise it every time your waitlist grows; a full queue is the clearest signal on earth that your price is too low.',
        'Last rule: never apologise for a number in public. State the price, list what it includes, and let it stand. The supporters you want are the ones who see the ninety hours behind the piece — and they would rather pay you fairly than watch you burn out for free.'
      ]
    },
    {
      id: 'sketch-to-final', title: 'From Sketch to Final: Anatomy of a Masterpiece',
      kicker: 'Process', date: 'May 2026', readTime: '8 min',
      cover: IMG + 'l11.jpg',
      excerpt: 'Sixty layers, four abandoned compositions, and one brushstroke redrawn forty times — what a process file really looks like inside.',
      body: [
        'Open the layered file of any painting on this platform and the first thing you learn is comforting: the artists you admire do not draw it right the first time either. The bottom layers are scaffolding — boxes, gesture lines, a horizon that will move four times before settling.',
        'The middle of the file is where the real decisions live. A colour study the size of a postage stamp decides the entire mood. A value check in brutal greyscale kills a composition that had survived a week of denial. Nothing about this is magic; all of it is judgement, applied repeatedly.',
        'The top layers are the ones that end up in wallpapers: the jewelled chains placed link by link, the single continuous dragon stroke redrawn forty times, the rim light that took ten minutes after the forty hours that earned it.',
        'This is why process content matters more than any tutorial: it shows the order of decisions, not just the result. Watch three real-time videos by an artist you love and you will learn more than a year of screenshots can teach.'
      ]
    },
    {
      id: 'first-hundred', title: 'Your First 100 Supporters',
      kicker: 'For Creators', date: 'April 2026', readTime: '7 min',
      cover: IMG + 'l06.jpg',
      excerpt: 'Practical, unromantic advice for artists opening their first tier — from artists who remember doing it.',
      body: [
        'The first hundred supporters are the hardest and the most honest. They arrive one at a time, they know your work already, and they are answering a simple question: does this artist show up?',
        'Post on a schedule you can actually keep. Every other Friday, kept for a year, beats daily-for-three-weeks followed by silence. Consistency is the product; the art is what it delivers.',
        'Make the free feed generous. The finished piece, full-size, watermark-free — public. What supporters buy is not access to the image; it is proximity to the making: the WIPs, the files, the votes, the voice. Artists who paywall everything grow slower than artists who paywall the process.',
        'And write your tier descriptions like a person. “The entry tier — you keep the lights on, you see everything early” outperforms three paragraphs of perk taxonomy. People do not subscribe to spreadsheets; they subscribe to you.'
      ]
    },
    {
      id: 'slow-art', title: 'Slow Art in the Age of the Feed',
      kicker: 'Essay', date: 'March 2026', readTime: '6 min',
      cover: IMG + 'l05.jpg',
      excerpt: 'The feed rewards the first half-second of a painting. Support platforms exist to pay for the other three weeks.',
      body: [
        'The economics of the feed are brutal and simple: an image earns its engagement in the first half-second. Everything past that — the hand-placed reflections, the composition that reads differently on the third look — is invisible to the algorithm and priceless to a person.',
        'Support platforms are a correction. They let a few thousand people say: paint the three-week painting anyway. Take the detour. Render the gold by hand. We are not the algorithm; we can wait.',
        'That patience shows up in the work. Compare a commission built for a client deadline with a supporter-funded personal piece and you can see the difference in the corners — the parts nobody demanded, done anyway.',
        'So here is the quiet radical act available to anyone who can spare a little: fund the slow version. The feed will still get its half-second. But you will know what the other three weeks look like, because you will have watched them happen.'
      ]
    }
  ];

  /* ------------------------------------------------ testimonials (static) */
  const REVIEWS = [
    { name: 'Helene D.', role: 'Supports 3 artists', text: 'I joined for WLOP’s PSD files and stayed for the process videos. Watching a painting happen in real time rewired how I see finished art.' },
    { name: 'Marcus T.', role: 'Studio tier · 2 years', text: 'The layered files are an art education by themselves. I’ve cancelled two streaming services to fund artists instead. Better television, honestly.' },
    { name: 'Priya S.', role: 'Supporter since 2025', text: 'Voting on the next piece is dangerously fun. We picked the clockwork violin. We were right.' },
    { name: 'Jonas W.', role: 'Creator, 800 supporters', text: 'I opened my page with 40 followers and shaking hands. The critique lounge and the creator guides here carried me to a living wage in fourteen months.' },
    { name: 'Camille R.', role: 'Atelier tier', text: 'My name is in the credits of a painting I watched being born on a Tuesday livestream. Try getting that feeling from a gallery.' },
    { name: 'Aya M.', role: 'New supporter', text: 'A few dollars a month and the sketchbook feed alone is worth it — abandoned versions, honest notes, the works. It feels like being trusted.' }
  ];

  /* ------------------------------------------------ helpers */
  const byId = (arr) => Object.fromEntries(arr.map(x => [x.id, x]));
  const fmtCount = (n) => n >= 1000000 ? (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
    : n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);
  const relTime = (iso) => {
    const s = Math.max(1, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60); if (m < 60) return m + ' min ago';
    const h = Math.floor(m / 60); if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
    const d = Math.floor(h / 24); return d + (d === 1 ? ' day ago' : ' days ago');
  };

  /* live catalog state (empty until loaded) */
  const state = { ARTISTS: [], ARTWORKS: [], THREADS: [], artistById: {}, artworkById: {}, artworkByUid: {} };

  async function load() {
    const sb = window.sb;
    if (!sb) throw new Error('Supabase client not loaded');
    const [pr, tr, wr, thr, po] = await Promise.all([
      sb.from('profiles').select('id,handle,name,tagline,avatar_url,cover_url,bio,statement,follower_count,member_count').eq('is_artist', true).order('follower_count', { ascending: false }),
      sb.from('tiers').select('id,artist_id,tier_key,name,price_cents,blurb,perks,featured,cta,sort').order('sort'),
      sb.from('artworks').select('id,slug,user_id,image_path,title,category,base_likes,like_count,comment_count,weeks,is_premium,visibility,alt,note,sort').is('deleted_at', null).order('sort'),
      sb.from('threads').select('id,slug,section,title,author,pinned,preview,sort').order('sort'),
      sb.from('posts').select('id,thread_id,user_id,author_name,body,created_at').is('deleted_at', null).order('created_at')
    ]);
    for (const r of [pr, tr, wr, thr, po]) if (r.error) throw r.error;

    const byHandle = {}, byUid = {};
    pr.data.forEach(p => {
      const a = {
        id: p.handle, uid: p.id, name: p.name, origin: '', practice: p.tagline || '',
        avatar: p.avatar_url || IMG_PLACEHOLDER_AVATAR, cover: p.cover_url || IMG_PLACEHOLDER_COVER,
        followers: p.follower_count, supporters: p.member_count,
        statement: p.statement || '', bio: p.bio || '', tiers: [], works: 0
      };
      byHandle[p.handle] = a; byUid[p.id] = a;
    });
    tr.data.forEach(t => {
      const a = byUid[t.artist_id]; if (!a) return;
      a.tiers.push({ uid: t.id, id: t.tier_key, name: t.name, price: Math.round(t.price_cents / 100), blurb: t.blurb, perks: t.perks || [], featured: t.featured, cta: t.cta });
    });

    /* The public collection is the artists' catalog. A member's own uploads are
       artworks too, but by non-artist users — those surface in the uploader's
       "Your uploads" strip (and, later, their profile), not the artist feed. So
       keep only artworks whose author is a known artist here. */
    const ARTWORKS = wr.data.map(w => {
      const a = byUid[w.user_id];
      if (a) a.works++;
      return {
        uid: w.id, id: w.slug, artist: a ? a.id : null, img: w.image_path, title: w.title, cat: w.category,
        likes: (w.base_likes || 0) + (w.like_count || 0), comments: w.comment_count || 0,
        weeks: w.weeks, premium: w.is_premium,
        members: w.visibility === 'members',
        alt: w.alt || '', note: w.note || '', ar: arOf(w.image_path)
      };
    }).filter(w => w.artist);
    const ARTISTS = pr.data.map(p => byHandle[p.handle]);

    const postsByThread = {};
    po.data.forEach(p => { (postsByThread[p.thread_id] = postsByThread[p.thread_id] || []).push({ id: p.id, uid: p.user_id, author: p.author_name, when: relTime(p.created_at), text: p.body }); });
    const THREADS = thr.data.map(t => {
      const posts = postsByThread[t.id] || [];
      return {
        uid: t.id, id: t.slug, section: t.section, title: t.title, author: t.author, pinned: t.pinned,
        preview: t.preview, replies: posts.length, likes: 0, when: posts.length ? posts[0].when : 'recently', posts
      };
    });

    state.ARTISTS = ARTISTS; state.ARTWORKS = ARTWORKS; state.THREADS = THREADS;
    state.artistById = byHandle; state.artworkById = byId(ARTWORKS);
    state.artworkByUid = Object.fromEntries(ARTWORKS.map(w => [w.uid, w]));
  }

  const ready = load().catch(e => { console.error('[Galera] catalog load failed:', (e && e.message) || e); });

  window.GALERA = {
    get ARTISTS() { return state.ARTISTS; },
    get ARTWORKS() { return state.ARTWORKS; },
    get THREADS() { return state.THREADS; },
    JOURNAL, REVIEWS, CATEGORIES,
    get artistById() { return state.artistById; },
    get artworkById() { return state.artworkById; },
    get artworkByUid() { return state.artworkByUid; },
    articleById: byId(JOURNAL),
    tiersFor: (h) => (state.artistById[h] && state.artistById[h].tiers) || [],
    lowestPrice: (h) => { const t = (state.artistById[h] && state.artistById[h].tiers) || []; return t.length ? Math.min(...t.map(x => x.price)) : 0; },
    worksByArtist: (h) => state.ARTWORKS.filter(w => w.artist === h),
    fmtCount, ready
  };
})();
