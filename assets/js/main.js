/* ============================================================
   GALERA — shared shell: header/footer, membership, favourites,
   global search, toasts, consent, reveal-on-scroll
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ------------------------------------------------ stores */
  const store = {
    get(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } },
    del(k) { try { localStorage.removeItem(k); } catch { } }
  };
  /* auth — backed by the Supabase session. Auth.member stays a sync getter for
     existing callers (null until the session is known); Auth.ready resolves once
     it is, and pages can await it or listen for the 'galera:auth' event. */
  const sb = window.sb;
  const displayName = (u) => {
    if (!u) return 'Member';
    const m = u.user_metadata || {};
    return m.full_name || m.name || (u.email ? u.email.split('@')[0] : 'Member');
  };
  const Auth = {
    user: null,
    _resolve: null,
    ready: null,
    /* true when this page was reached via a password-reset email link */
    recovery: /type=recovery/.test(location.hash),
    get member() { return this.user; },
    async signOut() { if (sb) await sb.auth.signOut(); }
  };
  Auth.ready = new Promise((res) => { Auth._resolve = res; });

  /* ------------------------------------------------ per-user library (Supabase)
     Favourites, likes, memberships and post-likes are the current user's own
     rows, guarded by RLS (auth.uid() = user_id). We load them once when the
     session resolves; the *.has() getters stay synchronous for renderers, while
     toggles write to the DB and return a promise resolving to the new state. */
  const uid = () => Auth.user && Auth.user.id;
  const Lib = {
    favs: new Set(),       // artwork uuids
    likes: new Set(),      // artwork uuids
    members: new Map(),    // artist uuid -> tier uuid
    postLikes: new Set(),  // post uuids
    follows: new Set(),    // followee profile uuids
    loaded: false,
    async load() {
      this.favs.clear(); this.likes.clear(); this.members.clear(); this.postLikes.clear(); this.follows.clear();
      const id = uid();
      if (sb && id) {
        const [f, l, m, pl, fo] = await Promise.all([
          sb.from('favourites').select('artwork_id').eq('user_id', id),
          sb.from('artwork_likes').select('artwork_id').eq('user_id', id),
          sb.from('memberships').select('artist_id,tier_id').eq('subscriber_id', id),
          sb.from('post_likes').select('post_id').eq('user_id', id),
          sb.from('follows').select('followee_id').eq('follower_id', id)
        ]);
        if (!f.error) f.data.forEach(r => this.favs.add(r.artwork_id));
        if (!l.error) l.data.forEach(r => this.likes.add(r.artwork_id));
        if (!m.error) m.data.forEach(r => this.members.set(r.artist_id, r.tier_id));
        if (!pl.error) pl.data.forEach(r => this.postLikes.add(r.post_id));
        if (!fo.error) fo.data.forEach(r => this.follows.add(r.followee_id));
      }
      this.loaded = true;
    }
  };

  /* toggle a membership-in-a-set table (favourites / artwork_likes / post_likes /
     follows). ownCol is the column holding the current user's id. */
  async function toggleRow(set, table, keyCol, val, ownCol) {
    ownCol = ownCol || 'user_id';
    const id = uid();
    if (!id) throw new Error('auth-required');
    const on = !set.has(val);
    if (on) {
      const { error } = await sb.from(table).insert({ [ownCol]: id, [keyCol]: val });
      if (error) throw error;
      set.add(val);
    } else {
      const { error } = await sb.from(table).delete().eq(ownCol, id).eq(keyCol, val);
      if (error) throw error;
      set.delete(val);
    }
    return on;
  }

  const Favs = {
    all() { return [...Lib.favs]; },
    has(id) { return Lib.favs.has(id); },
    toggle(id) { return toggleRow(Lib.favs, 'favourites', 'artwork_id', id); }
  };
  const Likes = {
    all() { return [...Lib.likes]; },
    has(id) { return Lib.likes.has(id); },
    toggle(id) { return toggleRow(Lib.likes, 'artwork_likes', 'artwork_id', id); }
  };
  const PostLikes = {
    has(id) { return Lib.postLikes.has(id); },
    toggle(id) { return toggleRow(Lib.postLikes, 'post_likes', 'post_id', id); }
  };
  const Follows = {
    all() { return [...Lib.follows]; },
    has(profileUid) { return Lib.follows.has(profileUid); },
    toggle(profileUid) { return toggleRow(Lib.follows, 'follows', 'followee_id', profileUid, 'follower_id'); }
  };
  const Members = {
    all() { return [...Lib.members.entries()]; },        // [[artistUid, tierUid], ...]
    has(artistUid) { return Lib.members.has(artistUid); },
    tierFor(artistUid) { return Lib.members.get(artistUid); },
    async join(artistUid, tierUid) {
      const id = uid();
      if (!id) throw new Error('auth-required');
      const { error } = await sb.from('memberships')
        .upsert({ subscriber_id: id, artist_id: artistUid, tier_id: tierUid, status: 'active' },
                { onConflict: 'subscriber_id,artist_id' });
      if (error) throw error;
      Lib.members.set(artistUid, tierUid);
    },
    async leave(artistUid) {
      const id = uid();
      if (!id) throw new Error('auth-required');
      const { error } = await sb.from('memberships').delete().eq('subscriber_id', id).eq('artist_id', artistUid);
      if (error) throw error;
      Lib.members.delete(artistUid);
    }
  };

  /* ------------------------------------------------ header */
  const page = document.body.dataset.page || '';
  const navItems = [
    ['gallery', 'gallery.html', 'Collection'],
    ['artists', 'artists.html', 'Artists'],
    ['explore', 'explore.html', 'Explore'],
    ['community', 'community.html', 'Community']
  ];
  const navLinks = navItems.map(([id, href, label]) =>
    `<a href="${href}" class="${page === id ? 'active' : ''}">${label}</a>`).join('');

  const accountHTML = (u) => u
    ? `<a class="member-chip" href="account.html" aria-label="Your account">
         <span class="avatar" aria-hidden="true">${esc(displayName(u)[0].toUpperCase())}</span>
         <span class="hide-mobile">${esc(displayName(u).split(' ')[0])}</span>
       </a>`
    : `<a class="btn btn-sm hide-mobile" href="auth.html">Sign in</a>
       <a class="btn btn-sm btn-solid hide-mobile" href="auth.html?mode=register">Join free</a>`;
  const accountNavHTML = (u) => u
    ? `<a href="account.html">Account <small>06</small></a>`
    : `<a href="auth.html">Sign in / Join <small>06</small></a>`;
  function renderAccount() {
    const a = document.getElementById('acctArea'); if (a) a.innerHTML = accountHTML(Auth.user);
    const n = document.getElementById('acctNavArea'); if (n) n.innerHTML = accountNavHTML(Auth.user);
  }

  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="header-inner">
      <a class="brand" href="index.html">GALER<em>A</em></a>
      <nav class="main-nav" aria-label="Primary">${navLinks}</nav>
      <div class="header-actions">
        <button class="icon-btn" id="searchOpen" aria-label="Search (Ctrl+K)" title="Search — Ctrl+K">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/></svg>
        </button>
        <span id="acctArea"></span>
        <button class="icon-btn nav-toggle" id="navOpen" aria-label="Open menu">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h12"/></svg>
        </button>
      </div>
    </div>`;
  document.body.prepend(header);

  const skip = document.createElement('a');
  skip.className = 'skip-link'; skip.href = '#main'; skip.textContent = 'Skip to content';
  document.body.prepend(skip);

  /* mobile nav */
  const mnav = document.createElement('div');
  mnav.className = 'mobile-nav';
  mnav.setAttribute('aria-hidden', 'true');
  mnav.innerHTML = `
    <button class="icon-btn close-x" aria-label="Close menu">✕</button>
    <nav aria-label="Mobile">
      <a href="index.html" class="${page === 'home' ? 'active' : ''}">Home <small>01</small></a>
      ${navItems.map(([id, href, label], i) =>
        `<a href="${href}" class="${page === id ? 'active' : ''}">${label} <small>0${i + 2}</small></a>`).join('')}
      <span id="acctNavArea"></span>
    </nav>`;
  document.body.appendChild(mnav);
  $('#navOpen').addEventListener('click', () => { mnav.classList.add('open'); mnav.setAttribute('aria-hidden', 'false'); });
  $('.close-x', mnav).addEventListener('click', () => { mnav.classList.remove('open'); mnav.setAttribute('aria-hidden', 'true'); });

  /* render logged-out immediately, then resolve the real session */
  renderAccount();
  (async function initAuth() {
    if (!sb) { Auth._resolve(null); return; }
    try {
      const { data: { session } } = await sb.auth.getSession();
      Auth.user = session ? session.user : null;
    } catch (e) { console.error('[Galera] session error', e); Auth.user = null; }
    try { await Lib.load(); } catch (e) { console.error('[Galera] library load error', e); }
    renderAccount();
    Auth._resolve(Auth.user);
    document.dispatchEvent(new CustomEvent('galera:auth', { detail: Auth.user }));
    let lastUid = uid();
    sb.auth.onAuthStateChange(async (_evt, session) => {
      if (_evt === 'PASSWORD_RECOVERY') Auth.recovery = true;
      Auth.user = session ? session.user : null;
      if (uid() !== lastUid) { lastUid = uid(); try { await Lib.load(); } catch (e) { console.error('[Galera] library reload error', e); } }
      renderAccount();
      document.dispatchEvent(new CustomEvent('galera:auth', { detail: Auth.user }));
    });
  })();

  /* header: solidify past the fold; hide on scroll-down, reveal on scroll-up */
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 24);
    if (Math.abs(y - lastY) > 6) {              /* ignore tiny jitters */
      const goingDown = y > lastY;
      /* never hide near the very top, or while a menu/overlay is open */
      const overlayOpen = mnav.classList.contains('open') || document.body.style.overflow === 'hidden';
      header.classList.toggle('hidden', goingDown && y > 140 && !overlayOpen);
      lastY = y;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------ footer */
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="wrap">
      <div class="footer-grid">
        <div class="footer-brand">
          <a class="brand" href="index.html">GALER<em>A</em></a>
          <p>Where digital artists share their work — and the people who love it keep it coming. Follow for free, support the artists you love.</p>
        </div>
        <div>
          <h4>Browse</h4>
          <ul>
            <li><a href="gallery.html">Artworks</a></li>
            <li><a href="artists.html">Artists</a></li>
            <li><a href="explore.html">Explore</a></li>
            <li><a href="about.html">About Galera</a></li>
          </ul>
        </div>
        <div>
          <h4>Community</h4>
          <ul>
            <li><a href="community.html">Forum</a></li>
            <li><a href="auth.html?mode=register">Become a Supporter</a></li>
            <li><a href="account.html">My Account</a></li>
            <li><a href="community.html#guidelines">House Rules</a></li>
          </ul>
        </div>
        <div>
          <h4>Platform</h4>
          <ul>
            <li><a href="contact.html">Contact &amp; Support</a></li>
            <li><a href="legal.html">Privacy &amp; GDPR</a></li>
            <li><a href="legal.html#terms">Terms of Service</a></li>
            <li><a href="404.html">Lost? (404)</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-word" aria-hidden="true">GALERA</div>
      <div class="footer-base">
        <span>© <span id="yr"></span> Galera. Demo build — artworks are placeholders © their original artists (incl. WLOP), to be replaced before deployment.</span>
      </div>
    </div>`;
  document.body.appendChild(footer);
  $('#yr').textContent = new Date().getFullYear();

  /* ------------------------------------------------ toasts */
  const zone = document.createElement('div');
  zone.className = 'toast-zone'; zone.setAttribute('aria-live', 'polite');
  document.body.appendChild(zone);
  function toast(msg, ms) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    zone.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 450); }, ms || 3200);
  }

  /* ------------------------------------------------ catalog load state
     A slim top progress bar while the catalog resolves, and a blocking
     retry card if it fails — so pages never sit silently blank. */
  (function catalogLoadState() {
    const D = window.GALERA;
    if (!D || !D.ready) return;                 // page doesn't use the catalog
    const bar = document.createElement('div');
    bar.className = 'load-bar';
    document.body.appendChild(bar);
    requestAnimationFrame(() => bar.classList.add('go'));
    D.ready.then(() => {
      bar.classList.add('done');
      setTimeout(() => bar.remove(), 500);
      if (D.loadError) showLoadError();
    });
  })();

  function showLoadError() {
    if (document.querySelector('.load-error')) return;
    const el = document.createElement('div');
    el.className = 'load-error';
    el.setAttribute('role', 'alert');
    el.innerHTML = `
      <div class="load-error-card">
        <span class="eyebrow" style="color:var(--red)">Couldn’t load</span>
        <h2 class="serif">The gallery didn’t load.</h2>
        <p class="dim">We couldn’t reach the server. Check your connection and try again — your account and saved work are safe.</p>
        <button class="btn btn-solid" id="loadRetry">Try again</button>
      </div>`;
    document.body.appendChild(el);
    document.body.style.overflow = 'hidden';
    el.querySelector('#loadRetry').addEventListener('click', () => location.reload());
  }

  /* ---------------------------------- horizontal rails on wheel */
  /* Hovering a horizontally scrollable rail turns the mouse wheel
     into horizontal scroll; at either end the page scrolls again. */
  document.addEventListener('wheel', (e) => {
    const rail = e.target.closest('.feat-row, .review-rail');
    if (!rail || rail.scrollWidth <= rail.clientWidth + 1) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    const atStart = rail.scrollLeft <= 0;
    const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 1;
    if ((delta > 0 && !atEnd) || (delta < 0 && !atStart)) {
      e.preventDefault();
      rail.scrollLeft += delta;
    }
  }, { passive: false });

  /* ------------------------------------------------ reveal */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  function watchReveals(root) { $$('.reveal:not(.in)', root).forEach(el => io.observe(el)); }
  watchReveals();

  /* ------------------------------------------------ search */
  const D = window.GALERA;
  const so = document.createElement('div');
  so.className = 'search-overlay';
  so.innerHTML = `
    <div class="lightbox-backdrop" data-close></div>
    <div class="search-panel" role="dialog" aria-modal="true" aria-label="Search the gallery">
      <div class="bar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/></svg>
        <input id="searchInput" type="search" placeholder="Search artworks, artists, essays…" autocomplete="off" aria-label="Search">
        <kbd>ESC</kbd>
      </div>
      <div class="search-results" id="searchResults"></div>
    </div>`;
  document.body.appendChild(so);
  const sInput = $('#searchInput', so);
  const sResults = $('#searchResults', so);

  function openSearch() { so.classList.add('open'); sInput.value = ''; renderSearch(''); setTimeout(() => sInput.focus(), 30); document.body.style.overflow = 'hidden'; }
  function closeSearch() { so.classList.remove('open'); document.body.style.overflow = ''; }
  $('#searchOpen').addEventListener('click', openSearch);
  so.addEventListener('click', e => { if (e.target.hasAttribute('data-close')) closeSearch(); });
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape' && so.classList.contains('open')) closeSearch();
  });
  sInput.addEventListener('input', () => renderSearch(sInput.value));

  function renderSearch(q) {
    q = q.trim().toLowerCase();
    if (!D) { sResults.innerHTML = ''; return; }
    const match = (s) => s.toLowerCase().includes(q);
    const works = q ? D.ARTWORKS.filter(w => match(w.title) || match(D.artistById[w.artist].name) || match(w.cat)).slice(0, 5) : D.ARTWORKS.slice(0, 4);
    const artists = q ? D.ARTISTS.filter(a => match(a.name) || match(a.practice) || match(a.bio)).slice(0, 4) : D.ARTISTS.slice(0, 3);
    const posts = q ? D.JOURNAL.filter(j => match(j.title) || match(j.excerpt)).slice(0, 3) : D.JOURNAL.slice(0, 2);
    let html = '';
    if (artists.length) {
      html += `<div class="sr-group">Artists</div>` + artists.map(a => `
        <a class="sr-item" href="artist.html?a=${a.id}">
          <span class="thumb"><img src="${a.avatar}" alt="" loading="lazy"></span>
          <span><span class="t">${esc(a.name)}</span><br><span class="s">${esc(a.practice)} · ${D.fmtCount(a.supporters)} supporters</span></span>
        </a>`).join('');
    }
    if (works.length) {
      html += `<div class="sr-group">Artworks</div>` + works.map(w => `
        <a class="sr-item" href="gallery.html?art=${w.id}">
          <span class="thumb"><img src="${w.img}" alt="" loading="lazy"></span>
          <span><span class="t">${esc(w.title)}</span><br><span class="s">${esc(D.artistById[w.artist].name)} · ${esc(w.cat)} · ♥ ${D.fmtCount(w.likes)}</span></span>
        </a>`).join('');
    }
    if (posts.length) {
      html += `<div class="sr-group">From the Journal</div>` + posts.map(j => `
        <a class="sr-item" href="explore.html?read=${j.id}">
          <span><span class="t">${esc(j.title)}</span><br><span class="s">${esc(j.kicker)} · ${esc(j.date)}</span></span>
        </a>`).join('');
    }
    sResults.innerHTML = html || `<div class="sr-empty">Nothing in the collection matches “${esc(q)}” — yet.</div>`;
  }

  /* ------------------------------------------------ consent */
  if (!store.get('galera_consent', null)) {
    const c = document.createElement('div');
    c.className = 'consent';
    c.setAttribute('role', 'dialog'); c.setAttribute('aria-label', 'Privacy preferences');
    c.innerHTML = `
      <strong class="serif" style="font-size:1.1rem">Your privacy, plainly.</strong>
      <p>We use essential cookies only. Optional analytics help us understand which artworks hold your attention — nothing is shared or sold. Choose freely; the gallery works either way.</p>
      <div class="row">
        <button class="btn btn-sm" data-choice="essential">Essential only</button>
        <button class="btn btn-sm btn-solid" data-choice="all">Accept analytics</button>
      </div>`;
    c.addEventListener('click', e => {
      const b = e.target.closest('[data-choice]');
      if (!b) return;
      store.set('galera_consent', { choice: b.dataset.choice, at: Date.now() });
      c.remove();
      toast(b.dataset.choice === 'all' ? 'Thank you — analytics enabled.' : 'Essential cookies only. Enjoy the gallery.');
    });
    setTimeout(() => document.body.appendChild(c), 1600);
  }

  /* newsletter forms (any page) — submitted to Netlify Forms */
  document.addEventListener('submit', async e => {
    const f = e.target.closest('.news-form');
    if (!f) return;
    e.preventDefault();
    const emailInput = $('input[type=email]', f);
    const em = emailInput.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { toast('Please enter a valid email address.'); return; }
    const btn = f.querySelector('button[type=submit]'); if (btn) btn.disabled = true;
    try {
      await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(f)).toString() });
      f.reset();
      toast('Welcome to the letter. First edition arrives Sunday.');
    } catch (err) {
      toast('Could not subscribe just now — please try again.');
    } finally { if (btn) btn.disabled = false; }
  });

  window.Galera = { Auth, Lib, Favs, Likes, Members, PostLikes, Follows, toast, watchReveals, esc, store, displayName, sb };
})();
