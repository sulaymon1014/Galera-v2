/* ============================================================
   GALERA — platform data
   Demo content: artworks are local placeholders © their original
   artists (incl. WLOP) — swap for licensed uploads before deploy.
   ============================================================ */
(function () {
  'use strict';

  const IMG = 'assets/img/art/';

  /* ------------------------------------------------ artists */
  const ARTISTS = [
    {
      id: 'wlop', name: 'WLOP', origin: 'GhostBlade universe',
      practice: 'Painted light & long stories',
      avatar: IMG + 'av1.jpg', cover: IMG + 'l04.jpg',
      followers: 843000, supporters: 12400, works: 0,
      statement: 'Painting light, one story at a time.',
      bio: 'Digital painter and author of the long-running webcomic GhostBlade. Known for luminous rendering, jewelled detail and heroines who carry entire kingdoms in a single look. Shares full PSDs, brushes and hours-long process videos with supporters.',
      tiers: [
        { id: 'reader', name: 'Reader', price: 8, blurb: 'Follow the work up close.',
          perks: ['Supporter-only feed & WIPs', 'HD wallpapers of every piece', 'GhostBlade pages a week early'] },
        { id: 'apprentice', name: 'Apprentice', price: 18, featured: true, cta: 'Enter the studio',
          blurb: 'Learn how the light is made.',
          perks: ['Everything in Reader', '4K downloads + layered PSDs', 'Hours-long narrated process videos', 'My full brush set'] },
        { id: 'circle', name: 'Ghostblade Circle', price: 35, blurb: 'Sit at the drawing table.',
          perks: ['Everything in Apprentice', 'Monthly live paint-along', 'Vote on where the story goes', 'Your name in the credits'] },
        { id: 'patron', name: 'Patron', price: 80, cta: 'Become a patron', blurb: 'For the deeply invested.',
          perks: ['Everything in the Circle', 'A monthly personal art critique', 'First refusal on original sketches'] }
      ]
    },
    {
      id: 'nocthene', name: 'Nocthene', origin: 'Shanghai / Berlin',
      practice: 'Cinematic sci-fi & music',
      avatar: IMG + 'av3.jpg', cover: IMG + 'l03.jpg',
      followers: 214000, supporters: 4120, works: 0,
      statement: 'I paint the concerts the future forgot to hold.',
      bio: 'Concept artist turned illustrator, painting planets as stages and violins as spaceships. Every piece ships with a matching music playlist; supporters vote on which instrument the next heroine plays. Process videos are real-time with commentary.',
      tiers: [
        { id: 'passenger', name: 'Passenger', price: 5, blurb: 'Come along for the ride.',
          perks: ['Supporter-only feed & WIPs', 'HD downloads', 'The matching playlist for every piece'] },
        { id: 'copilot', name: 'Co-pilot', price: 12, featured: true, cta: 'Take the controls',
          blurb: 'Help steer the next scene.',
          perks: ['Everything in Passenger', '4K downloads + layered PSDs', 'Real-time process videos with commentary', 'Vote on the next heroine’s instrument'] },
        { id: 'composer', name: 'Composer', price: 25, blurb: 'Score the whole thing.',
          perks: ['Everything in Co-pilot', 'Project files + music stems', 'Monthly livestream & Q&A', 'Your name in the credits'] }
      ]
    },
    {
      id: 'aurelith', name: 'Aurelith', origin: 'Warsaw, Poland',
      practice: 'Dark opulence & thrones',
      avatar: IMG + 'av2.jpg', cover: IMG + 'l08.jpg',
      followers: 158000, supporters: 2860, works: 0,
      statement: 'Gold behaves badly in the dark. That is why I paint it.',
      bio: 'Painter of crowns, relics and the people condemned to wear them. Renders metal the slow way — no photo textures, every reflection placed by hand. Supporters get layered PSDs, the custom gold-leaf brush set, and a monthly jewellery-rendering masterclass.',
      tiers: [
        { id: 'courtier', name: 'Courtier', price: 6, blurb: 'Stand in the gilded hall.',
          perks: ['Supporter-only feed & WIPs', 'HD downloads', 'Gilded work-in-progress shots'] },
        { id: 'goldsmith', name: 'Goldsmith', price: 15, featured: true, cta: 'Learn the gold',
          blurb: 'Render metal the slow way.',
          perks: ['Everything in Courtier', '4K downloads + layered PSDs', 'My custom gold-leaf brush set', 'Monthly jewellery-rendering masterclass'] },
        { id: 'regent', name: 'Regent', price: 30, blurb: 'Command the next relic.',
          perks: ['Everything in Goldsmith', 'Monthly live critique', 'Vote on the next crown or relic', 'Your name in the credits'] }
      ]
    },
    {
      id: 'selune', name: 'Selune', origin: 'Kyoto, Japan',
      practice: 'Soft light & quiet stories',
      avatar: IMG + 'av4.jpg', cover: IMG + 'l05.jpg',
      followers: 96000, supporters: 1540, works: 0,
      statement: 'Not every painting needs a battle. Some just need a window.',
      bio: 'Illustrator of gentle scenes on the edge of the fantastic — swans in libraries, festivals seen from balconies, the last light on a city of spires. Posts a finished piece every other Friday and a sketchbook page every day, without exception, since 2022.',
      tiers: [
        { id: 'daydreamer', name: 'Daydreamer', price: 4, cta: 'Follow the sketchbook',
          blurb: 'A quiet page every day.',
          perks: ['The daily sketchbook feed', 'Supporter-only WIPs', 'HD downloads of every piece'] },
        { id: 'lamplighter', name: 'Lamplighter', price: 10, featured: true, blurb: 'Light the whole city.',
          perks: ['Everything in Daydreamer', '4K downloads + layered PSDs', 'Every-other-Friday process videos', 'A printed postcard mailed monthly + your name in the credits'] }
      ]
    }
  ];

  /* ------------------------------------------------ tier fallback
     Each artist defines their own `tiers` (name, price, perks, button label,
     which is highlighted, and how many) — see tiersFor() below. This template
     is only a safety net for an artist who hasn't set tiers up yet. */
  const DEFAULT_TIERS = [
    {
      id: 'sketchbook', name: 'Sketchbook', price: 5,
      blurb: 'For staying close to the work.',
      perks: ['Supporter-only feed & WIPs', 'HD downloads of every piece', 'Sketchbook pages & studies', 'Discord community access']
    },
    {
      id: 'studio', name: 'Studio', price: 12, featured: true,
      blurb: 'For learning how it’s made.',
      perks: ['Everything in Sketchbook', '4K downloads + layered PSD files', 'Real-time process videos', 'Brush sets & custom tools']
    },
    {
      id: 'atelier', name: 'Atelier', price: 25,
      blurb: 'For being part of the studio.',
      perks: ['Everything in Studio', 'Monthly live paint-along & Q&A', 'Vote on the next piece', 'Your name in artwork credits']
    }
  ];

  /* ------------------------------------------------ artworks */
  const A = (id, img, title, artist, cat, likes, weeks, premium, alt, note) =>
    ({ id, img: IMG + img, title, artist, cat, likes, weeks, premium, alt, note });

  const ARTWORKS = [
    /* ---- WLOP ---- */
    A('w-blossom', 'l01.jpg', 'Beneath the Blossoms', 'wlop', 'Portrait', 48200, 1, true,
      'Girl in red with braided hair among plum blossom branches against a deep red wall',
      'A study in red on red — plum blossoms painted petal by petal over a two-week stream series.'),
    A('w-coronation', 'p08.jpg', 'Coronation', 'wlop', 'Fantasy', 61300, 3, true,
      'Queen in silver dress holding a great sword in a crowded cathedral, halo breaking above her',
      'From the GhostBlade chapter finale. The halo is painted breaking apart — crowns cost something.'),
    A('w-scarlet-veil', 'p09.jpg', 'Scarlet Veil', 'wlop', 'Portrait', 57800, 5, false,
      'Portrait of a green-eyed heroine with a jewelled veil of chains and butterfly-wing earrings',
      'Every chain link in the veil is hand-placed. Supporters get the 40-minute jewellery rendering breakdown.'),
    A('w-candlelight', 'p10.jpg', 'By the Window', 'wlop', 'Portrait', 39400, 7, false,
      'Woman in a black evening dress leaning against a bright window in a firelit hall',
      'One light source, one figure, one held breath. Painted as a values exercise that refused to stay one.'),
    A('w-first-market', 'l04.jpg', 'First Market of Spring', 'wlop', 'Story', 44900, 9, true,
      'Girl in festival dress buying candied fruit under hundreds of red lanterns, a small dog begging below',
      'New year market from the GhostBlade world — and yes, the dog gets the candied fruit in the next panel.'),
    A('w-monarch', 'p06.jpg', 'Monarch', 'wlop', 'Fantasy', 42600, 11, false,
      'Seated figure in a black butterfly-patterned cloak among jewelled mannequins',
      'The cloak borrows the wing pattern of a monarch butterfly; the mannequins wear the rejected designs.'),
    A('w-red-standard', 'l09.jpg', 'The Red Standard', 'wlop', 'Portrait', 36100, 13, false,
      'Wind-blown portrait with a red banner, jewelled face chain and a golden lion pauldron',
      'Painted in a single weekend for the anniversary stream. The wind arrived somewhere around hour six.'),
    A('w-dragon-festival', 'l13.jpg', 'Festival of the Paper Dragon', 'wlop', 'Scenery', 51200, 15, true,
      'A serpentine dragon winding through misty rooftops as children watch from a balcony strewn with red charms',
      'The dragon is one continuous brushstroke, redrawn forty times until it moved like paper in wind.'),

    /* ---- Nocthene ---- */
    A('n-orbital-ride', 'l02.jpg', 'Orbital Ride', 'nocthene', 'Sci-Fi', 28700, 2, true,
      'Girl seated on a neon-wheeled motorcycle parked on a mirror floor above a glowing Earth at night',
      'The bike is parked. That is the whole point — some machines exist for the view, not the ride.'),
    A('n-nocturne', 'l03.jpg', 'Nocturne for a Planet', 'nocthene', 'Sci-Fi', 31500, 4, false,
      'Violinist playing above the glowing night side of Earth, city lights tracing the coastlines',
      'City lights become the sheet music. Painted to Saint-Saëns No. 3 on repeat for eleven days.'),
    A('n-overture', 'l06.jpg', 'Overture at the Edge', 'nocthene', 'Sci-Fi', 26400, 6, false,
      'Violinist in a black dress standing on a rooftop ledge before a vast glowing planet',
      'Companion piece to Nocturne — the same concert, seen by the only member of the audience.'),
    A('n-clockwork', 'l11.jpg', 'Clockwork Sonata', 'nocthene', 'Portrait', 33800, 8, true,
      'Violinist in the dark playing a brass clockwork violin that scatters sparks',
      'The violin runs. Supporters get the mechanical turnaround showing every gear that would actually turn.'),
    A('n-departure', 'p04.jpg', 'Departure', 'nocthene', 'Story', 24100, 10, false,
      'Small girl with crutches at a rain-streaked terminal window, watching a giant airship dock',
      'The quietest piece in the series. She is not sad — she is memorising the hull number.'),

    /* ---- Aurelith ---- */
    A('a-gilded-hour', 'p02.jpg', 'The Gilded Hour', 'aurelith', 'Fantasy', 22300, 2, false,
      'Queen resting on an ornate golden throne beside a molten lion sculpture, night behind the columns',
      'Gold rendered entirely by hand — no photo textures, three weeks of placing reflections one by one.'),
    A('a-quiet-crown', 'p03.jpg', 'The Quiet Crown', 'aurelith', 'Portrait', 19800, 4, false,
      'Crowned woman in a black gown with gold embroidery standing at a painted table',
      'A queen at the hour when the court has gone home and the crown is just a heavy hat.'),
    A('a-death-answered', 'p05.jpg', 'And Death Answered', 'aurelith', 'Fantasy', 27600, 6, true,
      'Bride in white reaching up to a veiled skeletal figure crowned with a golden halo, skulls below',
      'The bargain scene from an unwritten book. She is not begging — look again at whose hand leads.'),
    A('a-horologist', 'l07.jpg', 'The Horologist', 'aurelith', 'Portrait', 21500, 8, true,
      'Woman surrounded by floating astrolabes, jewelled chains and glass orbs, resting her chin on one hand',
      'Time as jewellery. Every instrument in the frame keeps a different, equally wrong hour.'),
    A('a-regalia', 'l08.jpg', 'Regalia', 'aurelith', 'Fantasy', 25900, 10, false,
      'Queen on a vast engraved golden throne, one hand on a gilded skull, black silk pooling at her feet',
      'The throne took longer than the figure. Thrones usually do — that is their entire strategy.'),

    /* ---- Selune ---- */
    A('s-swan-library', 'l05.jpg', 'The Swan Library', 'selune', 'Story', 18400, 1, false,
      'Woman reading sheet music on the rim of a marble fountain, surrounded by seven attentive swans',
      'The swans are not decoration; they are the choir, and they are waiting for their cue.'),
    A('s-cathedral', 'l12.jpg', 'Cathedral of Swans', 'selune', 'Fantasy', 20700, 3, true,
      'Silver-haired elf in a navy gown seated on cathedral steps as swans court around her',
      'Painted after a real morning at the cathedral pond. The elf ears arrived without permission.'),
    A('s-trial', 'l10.jpg', 'The Trial of the White Lion', 'selune', 'Fantasy', 23200, 5, false,
      'Small figure in a white cape standing calm before a colossal roaring white lion in an arena of petals',
      'The arena expects a fight. She brought patience instead. The petals are on her side.'),
    A('s-sundown', 'p07.jpg', 'Sundown Companion', 'selune', 'Fantasy', 19600, 7, false,
      'Girl with a dragon-mask pauldron resting her forehead against a lion’s mane at burnt-orange sunset',
      'Some friendships require no dialogue. Painted warm on purpose; the world is orange when you are safe.'),
    A('s-lamplighter', 'l14.jpg', 'The Lamplighter', 'selune', 'Scenery', 17300, 9, false,
      'Woman with a glowing brush overlooking a dusk city of spires and warm windows',
      'She lights the city one window at a time with a paintbrush. A self-portrait, in the honest sense.'),
    A('s-tailwind', 'p01.jpg', 'Tailwind', 'selune', 'Story', 21900, 11, false,
      'Boy cycling along a canal at sunset with a girl in headphones riding side-saddle behind him',
      'The whole story is in the reflection: the water gets the version they will both remember.')
  ];

  /* work counts */
  ARTISTS.forEach(a => a.works = ARTWORKS.filter(w => w.artist === a.id).length);

  /* pixel dimensions of the bundled files — lets frames reserve the right
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
  ARTWORKS.forEach(w => {
    const d = DIMS[w.img.split('/').pop()];
    w.ar = d ? `${d[0]} / ${d[1]}` : '4 / 3';
  });

  const CATEGORIES = ['Portrait', 'Fantasy', 'Sci-Fi', 'Story', 'Scenery'];

  /* ------------------------------------------------ journal */
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

  /* ------------------------------------------------ testimonials */
  const REVIEWS = [
    { name: 'Helene D.', role: 'Supports 3 artists', text: 'I joined for WLOP’s PSD files and stayed for the process videos. Watching a painting happen in real time rewired how I see finished art.' },
    { name: 'Marcus T.', role: 'Studio tier · 2 years', text: 'The layered files are an art education by themselves. I’ve cancelled two streaming services to fund artists instead. Better television, honestly.' },
    { name: 'Priya S.', role: 'Supporter since 2025', text: 'Voting on the next piece is dangerously fun. We picked the clockwork violin. We were right.' },
    { name: 'Jonas W.', role: 'Creator, 800 supporters', text: 'I opened my page with 40 followers and shaking hands. The critique lounge and the creator guides here carried me to a living wage in fourteen months.' },
    { name: 'Camille R.', role: 'Atelier tier', text: 'My name is in the credits of a painting I watched being born on a Tuesday livestream. Try getting that feeling from a gallery.' },
    { name: 'Aya M.', role: 'New supporter', text: 'A few dollars a month and the sketchbook feed alone is worth it — abandoned versions, honest notes, the works. It feels like being trusted.' }
  ];

  /* -------------------------------------------- forum threads */
  const THREADS = [
    {
      id: 't-wip', section: 'Works in Progress', title: 'Weekly WIP thread — post what’s on your canvas',
      author: 'Galera Team', when: '2 hours ago', replies: 87, likes: 214, pinned: true,
      preview: 'The rules are unchanged and sacred: post the ugly middle stage, say what’s fighting you, no apologising for unfinished work…',
      posts: [
        { author: 'Galera Team', when: '2 hours ago', text: 'The rules are unchanged and sacred: post the ugly middle stage, say what’s fighting you, and no apologising for unfinished work. The middle stage is the job. Go.' },
        { author: 'Jonas W.', when: '1 hour ago', text: 'Armour study, hour six. The metal reads as plastic and I have stopped being able to tell why. Suspect my reflected light is the same temperature as my key light. Verdicts welcome.' },
        { author: 'Priya S.', when: '40 minutes ago', text: '@Jonas it’s the edges, not the temperature — your highlights have soft edges everywhere and metal needs those cruel hard ones. Sharpen three of them and watch it snap into place.' },
        { author: 'Aya M.', when: '12 minutes ago', text: 'First time posting here: portrait study from the Scarlet Veil breakdown. The chains defeated me but the skin tones finally behaved. Be gentle but be honest.' }
      ]
    },
    {
      id: 't-tablet', section: 'Tools & Software', title: 'Which tablet for a beginner in 2026 — honest answers',
      author: 'Aya M.', when: '7 hours ago', replies: 32, likes: 76,
      preview: 'Budget is around $400. Screen tablet or classic? Everyone online is sponsored and I trust this room more…',
      posts: [
        { author: 'Aya M.', when: '7 hours ago', text: 'Budget is around $400. Screen tablet or classic pad? Every review online is sponsored and I trust this room more than any of them.' },
        { author: 'Marcus T.', when: '6 hours ago', text: 'Unpopular truth: at $400, a good classic pad plus a colour-calibrated monitor beats a cheap screen tablet every time. Parallax on budget screens teaches bad habits.' },
        { author: 'Jonas W.', when: '4 hours ago', text: 'Seconding the pad. I painted my first 2,000 hours on one. The disconnect feels weird for two weeks, then becomes a superpower — your hand stops hiding your drawing.' },
        { author: 'Camille R.', when: '2 hours ago', text: 'Whatever you buy: spend the leftover on a decent chair. Nobody sponsors chairs, which is how you know it’s real advice.' }
      ]
    },
    {
      id: 't-critique', section: 'Critique Lounge', title: '[Critique] Lighting study — where does the focus die?',
      author: 'Jonas W.', when: 'Yesterday', replies: 19, likes: 41,
      preview: 'Night market scene, three light sources. Something in the middle distance is eating the composition and I’m too close to see it…',
      posts: [
        { author: 'Jonas W.', when: 'Yesterday', text: 'Night market scene, three light sources — lantern red, shop-window warm, moon cold. Something in the middle distance is eating the composition alive and I am too close to see it. Tear it apart.' },
        { author: 'Helene D.', when: 'Yesterday', text: 'Non-painter’s eye: everything is equally loud. The lanterns, the window, the moon — all shouting. In the WLOP market piece the lanterns win and everything else agrees to lose. Pick your winner.' },
        { author: 'Priya S.', when: '20 hours ago', text: 'Helene said it better than any tutorial. Also squint test: your value range in the middle distance is identical to the foreground. Push it back with two levels of contrast and the eye will stop snagging.' }
      ]
    },
    {
      id: 't-process', section: 'Process & Learning', title: 'Nocthene’s clockwork violin process video is a masterclass',
      author: 'Camille R.', when: '2 days ago', replies: 28, likes: 93,
      preview: 'Three hours, real-time, with commentary — and the part where the whole mechanism gets rebuilt at hour two is the most honest thing on this platform…',
      posts: [
        { author: 'Camille R.', when: '2 days ago', text: 'Three hours, real-time, with commentary. The part where the entire violin mechanism gets scrapped and rebuilt at hour two is the most honest thing I have watched on this platform. Studio tier paying for itself.' },
        { author: 'Marcus T.', when: '2 days ago', text: 'The gear teeth actually mesh. I paused and checked. There is a full mechanical turnaround in the supporter post. This is what “process content” should mean.' },
        { author: 'Aya M.', when: 'Yesterday', text: 'As a beginner the biggest lesson wasn’t technique — it was watching someone that good be uncertain for forty minutes and just keep going.' }
      ]
    },
    {
      id: 't-welcome', section: 'General Discussion', title: 'Introduce yourself — July thread',
      author: 'Galera Team', when: '4 days ago', replies: 64, likes: 118,
      preview: 'New here? Two questions, house tradition: the first digital artwork that stopped you cold, and what you’re here for — supporting, learning, or posting…',
      posts: [
        { author: 'Galera Team', when: '4 days ago', text: 'New here? Two questions, house tradition: name the first digital artwork that stopped you cold, and tell us what you’re here for — supporting, learning, posting, or all three.' },
        { author: 'Helene D.', when: '3 days ago', text: 'Stopped cold by: a GhostBlade cathedral piece, years ago, on a phone screen at 2 a.m. Here for: funding the slow versions. I don’t paint; I make paintings possible. It’s a good job.' },
        { author: 'Jonas W.', when: '3 days ago', text: 'First stopped by a tiny study of light through blinds — nothing epic, just true. Here for all three, but mostly to post the ugly middle stages until they stop being ugly.' }
      ]
    },
    {
      id: 't-payout', section: 'Support Q&A', title: 'How do artist payouts and the platform fee work?',
      author: 'New Member', when: '5 days ago', replies: 9, likes: 22,
      preview: 'Before I subscribe to two artists — how much of my pledge actually reaches them, and when?',
      posts: [
        { author: 'New Member', when: '5 days ago', text: 'Before I subscribe to two artists: how much of my pledge actually reaches them, and when? Sorry if this is a spreadsheet question — I like spreadsheets.' },
        { author: 'Galera Team', when: '5 days ago', text: 'Spreadsheet questions are our favourite kind. Artists keep 92% of every pledge; 8% runs the platform. Payouts land on the 1st of each month, no minimum balance, no payout fee. Refunds within 14 days are automatic and come out of our share, not the artist’s.' }
      ]
    }
  ];

  /* helpers */
  const byId = (arr) => Object.fromEntries(arr.map(x => [x.id, x]));
  const fmtCount = (n) => n >= 1000000 ? (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
    : n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);
  const artistMap = byId(ARTISTS);

  /* an artist's own tier set (name, price, perks, button label, highlight,
     count — all creator-defined); falls back to the template if unset */
  const tiersFor = (aid) => (artistMap[aid] && artistMap[aid].tiers) || DEFAULT_TIERS;
  /* an artist's lowest price (what "support from" would show) */
  const lowestPrice = (aid) => Math.min(...tiersFor(aid).map(t => t.price));

  window.GALERA = {
    ARTISTS, ARTWORKS, CATEGORIES, JOURNAL, REVIEWS, THREADS,
    artistById: artistMap,
    artworkById: byId(ARTWORKS),
    articleById: byId(JOURNAL),
    worksByArtist: (aid) => ARTWORKS.filter(w => w.artist === aid),
    tiersFor, lowestPrice,
    fmtCount
  };
})();
