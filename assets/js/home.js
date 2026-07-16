/* GALERA — home page */
(function () {
  'use strict';
  const D = window.GALERA, G = window.Galera, esc = G.esc;
  const $ = (s) => document.querySelector(s);

  /* hero */
  $('#heroArt').innerHTML = `<img src="assets/img/art/hero.jpg" alt="">`;
  $('#dropNote').textContent = D.DROP.tagline;
  $('#heroMeta').innerHTML = `
    <span><strong>${esc(D.DROP.title)}</strong></span>
    <span>${esc(D.DROP.note)}</span>`;

  /* member-aware CTA */
  if (G.Auth.member) {
    const c = $('#commJoin'); c.textContent = 'Enter the forum'; c.href = 'community.html';
  }

  /* ticker */
  const words = ['Character Art', 'Fantasy', 'Sci-Fi', 'Portraits', 'Scenery', 'Process Videos', 'Brushes & PSDs', 'Live Paint-Alongs'];
  const seq = words.map(w => `<span>${w}</span>`).join('');
  $('#tickerTrack').innerHTML = seq + seq;

  /* stats */
  const supporters = D.ARTISTS.reduce((s, a) => s + a.supporters, 0);
  $('#statRow').innerHTML = `
    <div class="stat"><div class="n">${D.ARTISTS.length}</div><div class="l">Artists</div></div>
    <div class="stat"><div class="n">${D.ARTWORKS.length}</div><div class="l">Artworks</div></div>
    <div class="stat"><div class="n">${D.fmtCount(supporters)}</div><div class="l">Supporters</div></div>`;

  /* trending — top six by likes */
  const feats = [...D.ARTWORKS].sort((a, b) => b.likes - a.likes).slice(0, 6);
  $('#featRow').innerHTML = feats.map((w, i) => `
    <a class="art-card reveal" href="gallery.html?art=${w.id}" data-delay="${i % 3}">
      <span class="feat-num">No. ${String(i + 1).padStart(2, '0')}</span>
      <div class="art-frame" style="aspect-ratio:${w.ar}">
        ${w.premium ? '<span class="badge-premium">◆ Supporters</span>' : ''}
        <img src="${w.img}" alt="${esc(w.alt)}" loading="${i < 2 ? 'eager' : 'lazy'}">
        <div class="art-hover"><span class="view-tag">View work</span></div>
      </div>
      <div class="art-caption">
        <div><div class="t">${esc(w.title)}</div><div class="a">${esc(D.artistById[w.artist].name)} · ${esc(w.cat)}</div></div>
        <div class="p">♥ ${D.fmtCount(w.likes)}</div>
      </div>
    </a>`).join('');

  /* featured artists */
  $('#artistRow').innerHTML = D.ARTISTS.map((a, i) => `
    <a class="artist-card reveal" data-delay="${i % 3}" href="artist.html?a=${a.id}">
      <div class="art-frame"><img src="${a.cover}" alt="Artwork by ${esc(a.name)}" loading="lazy"></div>
      <div class="card-row"><img class="avatar-img" src="${a.avatar}" alt=""></div>
      <div class="name">${esc(a.name)}</div>
      <div class="sub"><span>${esc(a.practice)}</span><span>${D.fmtCount(a.followers)} followers</span></div>
      <div class="support-from">Support from $${D.TIERS[0].price}/mo →</div>
    </a>`).join('');

  /* journal preview */
  $('#journalRow').innerHTML = D.JOURNAL.slice(0, 3).map((j, i) => `
    <a class="journal-card reveal" data-delay="${i}" href="explore.html?read=${j.id}">
      <div class="art-frame"><img src="${j.cover}" alt="" loading="lazy" style="aspect-ratio:16/9; object-fit:cover;"></div>
      <span class="kicker">${esc(j.kicker)}</span>
      <h3>${esc(j.title)}</h3>
      <p class="dim" style="font-size:.92rem">${esc(j.excerpt)}</p>
      <span class="meta">${esc(j.date)} · ${esc(j.readTime)} read</span>
    </a>`).join('');

  /* testimonials */
  $('#reviewRail').innerHTML = D.REVIEWS.map((r, i) => `
    <figure class="review-card reveal" data-delay="${i % 3}">
      <div>
        <div class="stars" aria-label="Five stars">★★★★★</div>
        <blockquote class="text" style="margin-top:14px">“${esc(r.text)}”</blockquote>
      </div>
      <figcaption class="who"><strong>${esc(r.name)}</strong>${esc(r.role)}</figcaption>
    </figure>`).join('');

  G.watchReveals();
})();
