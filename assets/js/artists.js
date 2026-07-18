/* GALERA — artist directory + artist page with support tiers */
(function () {
  'use strict';
  const D = window.GALERA, G = window.Galera, esc = G.esc;
  const $ = (s, el) => (el || document).querySelector(s);

  /* pledges: { artistId: tierId } — demo, this browser only */
  const pledges = G.store.get('galera_pledges', {});

  window.GALERA.ready.then(function () {
  /* ---------------- directory ---------------- */
  const grid = $('#artistGrid');
  if (grid) {
    const card = (a, i) => `
      <a class="artist-card reveal" data-delay="${i % 3}" href="artist.html?a=${a.id}">
        <div class="art-frame"><img src="${a.cover}" alt="Artwork by ${esc(a.name)}" loading="lazy"></div>
        <div class="card-row"><img class="avatar-img" src="${a.avatar}" alt=""></div>
        <div class="name">${esc(a.name)}</div>
        <div class="sub"><span>${esc(a.practice)}</span><span>${a.works} works</span></div>
        <div class="sub" style="margin-top:6px"><span>${D.fmtCount(a.followers)} followers</span><span>${D.fmtCount(a.supporters)} supporters</span></div>
        <div class="support-from">${pledges[a.id] ? '♥ You support this artist' : 'Support Artist →'}</div>
      </a>`;
    const render = (q) => {
      q = (q || '').trim().toLowerCase();
      const list = D.ARTISTS.filter(a =>
        !q || [a.name, a.practice, a.bio, a.statement].some(s => s.toLowerCase().includes(q)));
      grid.innerHTML = list.map(card).join('');
      $('#artistEmpty').hidden = list.length > 0;
      G.watchReveals(grid);
    };
    render('');
    $('#artistSearch').addEventListener('input', (e) => render(e.target.value));
  }

  /* ---------------- profile ---------------- */
  const profile = $('#profile');
  if (profile) {
    const id = new URLSearchParams(location.search).get('a');
    const a = D.artistById[id] || D.ARTISTS[0];
    document.title = `${a.name} — Galera`;
    const works = D.worksByArtist(a.id);

    function tierCard(t) {
      const active = pledges[a.id] === t.id;
      return `
        <div class="tier-card ${t.featured ? 'featured' : ''}">
          ${t.featured ? `<span class="tier-tag">${esc(t.badge || 'Most popular')}</span>` : ''}
          <h3 class="serif">${esc(t.name)}</h3>
          <div class="tier-price">$${t.price}<small> /month</small></div>
          <p class="dim" style="font-size:.88rem">${esc(t.blurb)}</p>
          <ul>${t.perks.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
          <button class="btn ${active ? '' : 'btn-solid'} btn-wide" data-tier="${t.id}">
            ${active ? '♥ Supporting — cancel' : esc(t.cta || 'Join ' + t.name)}
          </button>
        </div>`;
    }

    function render() {
      const tier = pledges[a.id];
      profile.innerHTML = `
        <div class="profile-cover reveal"><img src="${a.cover}" alt="Artwork by ${esc(a.name)}"></div>
        <div class="profile-head reveal">
          <img class="avatar-lg" src="${a.avatar}" alt="">
          <div class="who">
            <h1>${esc(a.name)}</h1>
            <span class="sub">${esc(a.practice)} · ${esc(a.origin)}</span>
          </div>
          <div class="cta">
            <a class="btn btn-sm" href="artists.html">← All artists</a>
            <a class="btn btn-sm ${tier ? '' : 'btn-solid'}" href="#tiers">${tier ? '♥ Supporting' : 'Become a supporter'}</a>
          </div>
        </div>

        <div class="split" style="margin-top:clamp(36px,5vw,64px); align-items:start;">
          <div class="reveal" style="display:grid; gap:20px;">
            <blockquote class="pull-quote">${esc(a.statement)}</blockquote>
            <p class="dim" style="font-size:1.02rem; line-height:1.8">${esc(a.bio)}</p>
          </div>
          <div class="reveal" data-delay="1">
            <div class="stat-row">
              <div class="stat"><div class="n">${D.fmtCount(a.followers)}</div><div class="l">Followers</div></div>
              <div class="stat"><div class="n">${D.fmtCount(a.supporters)}</div><div class="l">Supporters</div></div>
              <div class="stat"><div class="n">${a.works}</div><div class="l">Works</div></div>
            </div>
            <hr class="hr" style="margin:30px 0">
            <p class="dim" style="font-size:.9rem">Supporters unlock every piece’s 4K files, layered PSDs and process videos — and keep ${esc(a.name)} painting the slow versions. Artists keep 92% of every pledge.</p>
          </div>
        </div>

        <div id="tiers" style="margin-top:clamp(48px,7vw,80px)">
          <div class="section-head reveal">
            <div class="stack">
              <span class="eyebrow">Support tiers</span>
              <h2>Step inside the studio.</h2>
            </div>
          </div>
          <p class="dim reveal" style="font-size:.9rem; margin-bottom:22px">${esc(a.name)} designs these tiers — names, perks and prices are all theirs. Every artist on Galera builds their own.</p>
          <div class="tier-grid reveal" data-delay="1">${D.tiersFor(a.id).map(tierCard).join('')}</div>
        </div>

        <div style="margin-top:clamp(48px,7vw,80px)">
          <div class="section-head reveal">
            <div class="stack">
              <span class="eyebrow">Gallery</span>
              <h2>Works by ${esc(a.name)}</h2>
            </div>
            <a class="link-arrow" href="gallery.html">All artworks</a>
          </div>
          <div class="masonry">
            ${works.map((w, i) => `
              <a class="art-card reveal" data-delay="${i % 3}" href="gallery.html?art=${w.id}">
                <div class="art-frame">
                  ${w.premium ? '<span class="badge-premium">◆ Supporters</span>' : ''}
                  <img src="${w.img}" alt="${esc(w.alt)}" loading="lazy">
                  <div class="art-hover"><span class="view-tag">View work</span></div>
                </div>
                <div class="art-caption">
                  <div><div class="t">${esc(w.title)}</div><div class="a">${esc(w.cat)}</div></div>
                  <div class="p">♥ ${D.fmtCount(w.likes)}</div>
                </div>
              </a>`).join('')}
          </div>
        </div>`;
      G.watchReveals(profile);
    }
    render();

    profile.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tier]');
      if (!btn) return;
      if (!G.Auth.member) {
        G.toast('Sign in first — joining takes a minute and membership is free.');
        setTimeout(() => location.href = 'auth.html?mode=register', 900);
        return;
      }
      const t = btn.dataset.tier;
      if (pledges[a.id] === t) {
        delete pledges[a.id];
        G.toast(`Support cancelled. ${a.name} will understand — the door stays open.`);
      } else {
        pledges[a.id] = t;
        const tierName = D.tiersFor(a.id).find(x => x.id === t).name;
        G.toast(`Welcome to ${a.name}’s ${tierName} tier! (Demo — no payment taken.)`);
      }
      G.store.set('galera_pledges', pledges);
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
    });
  }
  });
})();
