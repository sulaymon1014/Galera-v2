/* GALERA — explore / articles */
(function () {
  'use strict';
  const D = window.GALERA, G = window.Galera, esc = G.esc;
  const $ = (s) => document.querySelector(s);

  const [feature, ...rest] = D.JOURNAL;
  const cover = (j) => `<div class="art-frame"><img src="${j.cover}" alt="" loading="lazy" style="aspect-ratio:16/9; object-fit:cover;"></div>`;

  $('#featureSlot').innerHTML = `
    <a class="journal-feature reveal" href="?read=${feature.id}" data-read="${feature.id}">
      ${cover(feature)}
      <div style="display:grid; gap:16px;">
        <span class="kicker" style="font-size:.7rem; font-weight:700; letter-spacing:.26em; text-transform:uppercase; color:var(--gold)">${esc(feature.kicker)} · Featured</span>
        <h2 class="serif">${esc(feature.title)}</h2>
        <p class="dim">${esc(feature.excerpt)}</p>
        <span class="dim" style="font-size:.78rem">${esc(feature.date)} · ${esc(feature.readTime)} read</span>
        <span class="link-arrow">Read the article</span>
      </div>
    </a>`;

  $('#journalGrid').innerHTML = rest.map((j, i) => `
    <a class="journal-card reveal" data-delay="${i % 3}" href="?read=${j.id}" data-read="${j.id}">
      ${cover(j)}
      <span class="kicker">${esc(j.kicker)}</span>
      <h3>${esc(j.title)}</h3>
      <p class="dim" style="font-size:.92rem">${esc(j.excerpt)}</p>
      <span class="meta">${esc(j.date)} · ${esc(j.readTime)} read</span>
    </a>`).join('');

  /* ---------------- reader ---------------- */
  const reader = $('#reader');
  const card = $('#readerCard');

  function openReader(id, push) {
    const j = D.articleById[id];
    if (!j) return;
    card.innerHTML = `
      <span class="eyebrow">${esc(j.kicker)} · ${esc(j.date)} · ${esc(j.readTime)}</span>
      <h2 class="serif" style="font-size:clamp(1.8rem,3.4vw,2.8rem)">${esc(j.title)}</h2>
      ${cover(j)}
      <div class="body">${j.body.map(p => `<p>${esc(p)}</p>`).join('')}</div>
      <hr class="hr">
      <div style="display:flex; flex-wrap:wrap; gap:12px; justify-content:space-between; align-items:center;">
        <span class="dim" style="font-size:.85rem">Enjoyed this? The Friday Drop carries one like it each week.</span>
        <a class="btn btn-sm" href="community.html">Discuss in the forum</a>
      </div>`;
    reader.classList.add('open');
    document.body.style.overflow = 'hidden';
    reader.querySelector('.reader-panel').scrollTop = 0;
    if (push !== false) history.replaceState(null, '', '?read=' + id);
  }
  function closeReader() {
    reader.classList.remove('open');
    document.body.style.overflow = '';
    history.replaceState(null, '', location.pathname);
  }

  document.addEventListener('click', (e) => {
    const open = e.target.closest('[data-read]');
    if (open) { e.preventDefault(); openReader(open.dataset.read); return; }
    if (e.target.hasAttribute('data-r-close') && !e.target.closest('.reader-card')) closeReader();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && reader.classList.contains('open')) closeReader();
  });

  const deep = new URLSearchParams(location.search).get('read');
  if (deep) setTimeout(() => openReader(deep, false), 200);

  G.watchReveals();
})();
