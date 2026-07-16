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
  const Auth = {
    get member() { return store.get('galera_member', null); },
    signIn(m) { store.set('galera_member', m); },
    signOut() { store.del('galera_member'); }
  };
  const Favs = {
    all() { return store.get('galera_favs', []); },
    has(id) { return this.all().includes(id); },
    toggle(id) {
      let f = this.all();
      const on = f.includes(id);
      f = on ? f.filter(x => x !== id) : f.concat(id);
      store.set('galera_favs', f);
      return !on;
    }
  };

  /* ------------------------------------------------ header */
  const page = document.body.dataset.page || '';
  const member = Auth.member;
  const navItems = [
    ['gallery', 'gallery.html', 'Collection'],
    ['artists', 'artists.html', 'Artists'],
    ['explore', 'explore.html', 'Explore'],
    ['community', 'community.html', 'Community']
  ];
  const navLinks = navItems.map(([id, href, label]) =>
    `<a href="${href}" class="${page === id ? 'active' : ''}">${label}</a>`).join('');

  const accountUI = member
    ? `<a class="member-chip" href="account.html" aria-label="Your account">
         <span class="avatar" aria-hidden="true">${esc((member.name || 'M')[0].toUpperCase())}</span>
         <span class="hide-mobile">${esc((member.name || 'Member').split(' ')[0])}</span>
       </a>`
    : `<a class="btn btn-sm hide-mobile" href="auth.html">Sign in</a>
       <a class="btn btn-sm btn-solid hide-mobile" href="auth.html?mode=register">Join free</a>`;

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
        ${accountUI}
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
      ${member
        ? `<a href="account.html">Account <small>06</small></a>`
        : `<a href="auth.html">Sign in / Join <small>06</small></a>`}
    </nav>`;
  document.body.appendChild(mnav);
  $('#navOpen').addEventListener('click', () => { mnav.classList.add('open'); mnav.setAttribute('aria-hidden', 'false'); });
  $('.close-x', mnav).addEventListener('click', () => { mnav.classList.remove('open'); mnav.setAttribute('aria-hidden', 'true'); });

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

  /* newsletter forms (any page) */
  document.addEventListener('submit', e => {
    const f = e.target.closest('.news-form');
    if (!f) return;
    e.preventDefault();
    const em = $('input', f).value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { toast('Please enter a valid email address.'); return; }
    $('input', f).value = '';
    toast('Welcome to the letter. First edition arrives Sunday. (Demo — nothing was sent.)');
  });

  window.Galera = { Auth, Favs, toast, watchReveals, esc, store };
})();
