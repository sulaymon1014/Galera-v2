/* ============================================================
   GALERA — artworks page: filters, sorting, lightbox, likes,
   member uploads. OR within a facet, AND across facets;
   live counts; removable chips; deep links via ?art=<id>
   ============================================================ */
(function () {
  'use strict';
  const D = window.GALERA, G = window.Galera, esc = G.esc;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  Promise.all([window.GALERA.ready, G.Auth.ready]).then(function () {
  /* ---------------- facet model ---------------- */
  const FACETS = [
    {
      key: 'cat', label: 'Category',
      options: D.CATEGORIES.map(c => ({ id: c, label: c, test: w => w.cat === c }))
    },
    {
      key: 'artist', label: 'Artist',
      options: D.ARTISTS.map(a => ({ id: a.id, label: a.name, test: w => w.artist === a.id }))
    },
    {
      key: 'access', label: 'Access',
      options: [
        { id: 'free', label: 'Free for everyone', test: w => !w.premium },
        { id: 'premium', label: '◆ Supporter extras', test: w => w.premium }
      ]
    }
  ];

  const sel = {};
  FACETS.forEach(f => sel[f.key] = new Set());
  let sortBy = 'trending';

  const optById = {};
  FACETS.forEach(f => f.options.forEach(o => optById[f.key + ':' + o.id] = o));

  /* like/save state lives in G.Likes / G.Favs (Supabase, loaded per session).
     w.likes is the authoritative count at load; session toggles adjust it ±1. */
  const requireAuth = (msg) => {
    if (G.Auth.member) return true;
    G.toast(msg);
    setTimeout(() => location.href = 'auth.html?mode=register', 900);
    return false;
  };

  function matchesFacet(w, facet) {
    const s = sel[facet.key];
    if (!s.size) return true;
    return facet.options.some(o => s.has(o.id) && o.test(w));
  }
  function filtered(excludeKey) {
    return D.ARTWORKS.filter(w => FACETS.every(f => f.key === excludeKey || matchesFacet(w, f)));
  }
  function sorted(list) {
    const l = [...list];
    if (sortBy === 'newest') l.sort((a, b) => a.weeks - b.weeks);
    else if (sortBy === 'loved') l.sort((a, b) => b.likes - a.likes);
    else l.sort((a, b) => (b.likes / (b.weeks + 2)) - (a.likes / (a.weeks + 2)));
    return l;
  }

  /* ---------------- facet UI ---------------- */
  const facetGroups = $('#facetGroups');
  function renderFacets() {
    facetGroups.innerHTML = FACETS.map((f) => {
      const base = filtered(f.key);
      return `
      <details class="facet-group" open>
        <summary>${f.label}</summary>
        <div class="facet-opts">
          ${f.options.map(o => {
            const count = base.filter(o.test).length;
            const checked = sel[f.key].has(o.id);
            return `
            <label class="facet-opt ${count === 0 && !checked ? 'zero' : ''}">
              <input type="checkbox" data-facet="${f.key}" data-opt="${o.id}" ${checked ? 'checked' : ''}>
              <span class="box" aria-hidden="true"></span>
              <span>${esc(o.label)}</span>
              <span class="count">${count}</span>
            </label>`;
          }).join('')}
        </div>
      </details>`;
    }).join('');
  }
  facetGroups.addEventListener('change', (e) => {
    const cb = e.target.closest('input[data-facet]');
    if (!cb) return;
    const s = sel[cb.dataset.facet];
    cb.checked ? s.add(cb.dataset.opt) : s.delete(cb.dataset.opt);
    update();
  });

  /* ---------------- chips ---------------- */
  const chips = $('#chips');
  function renderChips() {
    const active = [];
    FACETS.forEach(f => sel[f.key].forEach(id => active.push({ f: f.key, id, label: optById[f.key + ':' + id].label })));
    chips.innerHTML = active.map(a =>
      `<button class="chip" data-f="${a.f}" data-o="${a.id}" aria-label="Remove filter ${esc(a.label)}">${esc(a.label)} <span class="x">✕</span></button>`
    ).join('') + (active.length > 1 ? `<button class="chip clear-all" data-clear>Clear all</button>` : '');
    $('#facetBadge').textContent = active.length ? `(${active.length})` : '';
  }
  chips.addEventListener('click', (e) => {
    const clr = e.target.closest('[data-clear]');
    if (clr) { clearAll(); return; }
    const c = e.target.closest('.chip[data-f]');
    if (!c) return;
    sel[c.dataset.f].delete(c.dataset.o);
    update();
  });
  function clearAll() { FACETS.forEach(f => sel[f.key].clear()); update(); }
  $('#emptyClear').addEventListener('click', clearAll);

  /* ---------------- grid ---------------- */
  const grid = $('#grid');
  function renderGrid() {
    const list = sorted(filtered(null));
    $('#resultCount').innerHTML = `Showing <strong>${list.length}</strong> of ${D.ARTWORKS.length} artworks`;
    $('#emptyState').hidden = list.length > 0;
    grid.innerHTML = list.map((w, i) => {
      const artist = D.artistById[w.artist];
      const fav = G.Favs.has(w.uid);
      return `
      <article class="art-card reveal" data-delay="${i % 3}">
        <button class="fav-btn ${fav ? 'on' : ''}" data-fav="${w.uid}" aria-label="${fav ? 'Remove from' : 'Add to'} saved" title="Save">${fav ? '♥' : '♡'}</button>
        <a href="?art=${w.id}" data-open="${w.id}" aria-label="View ${esc(w.title)} by ${esc(artist.name)}">
          <div class="art-frame">
            ${w.members ? '<span class="badge-premium">🔒 Members only</span>' : w.premium ? '<span class="badge-premium">◆ Supporters</span>' : ''}
            <img src="${w.img}" alt="${esc(w.alt)}" loading="lazy">
            <div class="art-hover"><span class="view-tag">View work</span><span class="view-tag" style="color:var(--ink-dim)">${esc(w.cat)}</span></div>
          </div>
          <div class="art-caption">
            <div><div class="t">${esc(w.title)}</div><div class="a">${esc(artist.name)}</div></div>
            <div class="p">♥ ${D.fmtCount(w.likes)}</div>
          </div>
        </a>
      </article>`;
    }).join('');
    G.watchReveals(grid);
  }
  grid.addEventListener('click', async (e) => {
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      e.preventDefault();
      if (!requireAuth('Sign in to save works — membership is free.')) return;
      try {
        const on = await G.Favs.toggle(favBtn.dataset.fav);
        favBtn.classList.toggle('on', on);
        favBtn.textContent = on ? '♥' : '♡';
        G.toast(on ? 'Saved to your collection.' : 'Removed from your collection.');
      } catch (err) { G.toast('Could not update your saved works — try again.'); }
      return;
    }
    const link = e.target.closest('[data-open]');
    if (link) { e.preventDefault(); openLightbox(link.dataset.open); }
  });

  function update() { renderFacets(); renderChips(); renderGrid(); }

  /* ---------------- sort ---------------- */
  $('#sortSel').addEventListener('change', (e) => { sortBy = e.target.value; renderGrid(); });

  /* ---------------- mobile facets ---------------- */
  const facets = $('#facets');
  $('#facetsOpen').addEventListener('click', () => { facets.classList.add('open'); document.body.style.overflow = 'hidden'; });
  const closeFacets = () => { facets.classList.remove('open'); document.body.style.overflow = ''; };
  $('#facetsClose').addEventListener('click', closeFacets);
  $('#facetsApply').addEventListener('click', closeFacets);
  $('#facetsClearM').addEventListener('click', () => { clearAll(); });

  /* ---------------- lightbox ---------------- */
  const lb = $('#lightbox');
  const lbCard = $('#lbCard');
  let currentId = null;

  function visibleList() { return sorted(filtered(null)); }

  function openLightbox(id, push) {
    const w = D.artworkById[id];
    if (!w) return;
    currentId = id;
    const artist = D.artistById[w.artist];
    const fav = G.Favs.has(w.uid);
    const isLiked = G.Likes.has(w.uid);
    const supporting = G.Members.has(artist.uid);   /* active member of this artist */
    const related = D.ARTWORKS.filter(x => x.id !== id && x.artist === w.artist).slice(0, 3);

    lbCard.innerHTML = `
      <div class="lightbox-art"><img src="${w.img}" alt="${esc(w.alt)}"></div>
      <div class="lightbox-info">
        <a href="artist.html?a=${artist.id}" style="display:flex; align-items:center; gap:12px;">
          <img src="${artist.avatar}" alt="" style="width:44px; height:44px; border-radius:50%; object-fit:cover; border:1px solid var(--line);">
          <span>
            <span class="artist-link">${esc(artist.name)} →</span><br>
            <span class="dim" style="font-size:.78rem">${D.fmtCount(artist.supporters)} supporters</span>
          </span>
        </a>
        <div>
          <h2 class="serif" style="font-size:clamp(1.6rem,2.6vw,2.2rem)">${esc(w.title)}</h2>
          <p class="dim" style="font-size:.95rem; margin-top:10px">${esc(w.note)}</p>
        </div>
        <dl class="meta-table">
          <div><dt>Category</dt><dd>${esc(w.cat)}</dd></div>
          <div><dt>Posted</dt><dd>${w.weeks === 1 ? 'this week' : w.weeks + ' weeks ago'}</dd></div>
          <div><dt>Appreciations</dt><dd id="lbLikeCount">♥ ${D.fmtCount(w.likes)}</dd></div>
          <div><dt>Free download</dt><dd>Full size, watermark-free</dd></div>
          ${w.premium ? `<div><dt>Supporter extras</dt><dd class="gold">${supporting ? '✓ Unlocked — 4K · PSD · process video' : '4K · PSD · process video — locked'}</dd></div>` : ''}
          ${w.members ? `<div><dt>Visibility</dt><dd class="gold">Members only — you have access</dd></div>` : ''}
        </dl>
        <div class="lightbox-actions">
          <button class="btn ${isLiked ? 'btn-solid' : ''}" id="lbLike">${isLiked ? '♥ Loved' : '♡ Love it'}</button>
          <button class="btn" id="lbFav">${fav ? '♥ Saved' : '♡ Save'}</button>
          <button class="btn" id="lbShare" title="Copy link">Share</button>
        </div>
        ${supporting
          ? `<a class="btn btn-wide" href="artist.html?a=${artist.id}#tiers">♥ You support ${esc(artist.name)} — manage</a>`
          : `<a class="btn btn-solid btn-wide" href="artist.html?a=${artist.id}#tiers">Support ${esc(artist.name)} — from $${D.lowestPrice(artist.id)}/mo</a>`}
        ${related.length ? `
        <div class="related-strip">
          <span class="eyebrow" style="font-size:.62rem">More from ${esc(artist.name)}</span>
          <div class="row">
            ${related.map(x => `<button class="related-thumb" data-rel="${x.id}" aria-label="View ${esc(x.title)}"><img src="${x.img}" alt="" loading="lazy"></button>`).join('')}
          </div>
        </div>` : ''}
      </div>`;

    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (push !== false) history.replaceState(null, '', '?art=' + id);

    $('#lbLike').addEventListener('click', async (e) => {
      if (!requireAuth('Sign in to appreciate works — membership is free.')) return;
      try {
        const on = await G.Likes.toggle(w.uid);
        w.likes += on ? 1 : -1;              // adjust the loaded count by the delta
        e.target.textContent = on ? '♥ Loved' : '♡ Love it';
        e.target.classList.toggle('btn-solid', on);
        $('#lbLikeCount').textContent = '♥ ' + D.fmtCount(w.likes);
        renderGrid();
      } catch (err) { G.toast('Could not update your appreciation — try again.'); }
    });
    $('#lbFav').addEventListener('click', async (e) => {
      if (!requireAuth('Sign in to save works — membership is free.')) return;
      try {
        const on = await G.Favs.toggle(w.uid);
        e.target.textContent = on ? '♥ Saved' : '♡ Save';
        G.toast(on ? 'Saved to your collection.' : 'Removed from your collection.');
        renderGrid();
      } catch (err) { G.toast('Could not update your saved works — try again.'); }
    });
    $('#lbShare').addEventListener('click', () => {
      const url = location.origin + location.pathname + '?art=' + id;
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject())
        .then(() => G.toast('Link copied — send it to someone with good taste.'))
        .catch(() => G.toast(url));
    });
    $$('[data-rel]', lbCard).forEach(b => b.addEventListener('click', () => openLightbox(b.dataset.rel)));
  }

  function closeLightbox() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    currentId = null;
    history.replaceState(null, '', location.pathname);
  }
  function step(dir) {
    if (!currentId) return;
    const list = visibleList();
    const i = list.findIndex(x => x.id === currentId);
    if (i === -1) return;
    openLightbox(list[(i + dir + list.length) % list.length].id);
  }
  lb.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-lb-close') || e.target.closest('[data-lb-close]')) {
      if (!e.target.closest('.lightbox-card')) closeLightbox();
    }
  });
  $('#lbPrev').addEventListener('click', (e) => { e.stopPropagation(); step(-1); });
  $('#lbNext').addEventListener('click', (e) => { e.stopPropagation(); step(1); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  /* ---------------- member uploads (real: Storage bucket + artworks row) ------
     Files land in the 'artworks' bucket under <uid>/<file> (storage RLS), and a
     row is inserted into public.artworks (RLS: auth.uid() = user_id). We show the
     signed-in user's own uploads, freshly loaded from the DB. */
  const uploadModal = $('#uploadModal');
  let uploads = [];                 // the current user's own artworks
  $('#upCat').innerHTML = D.CATEGORIES.map(c => `<option>${c}</option>`).join('');

  const storagePath = (url) => { const i = String(url).indexOf('/artworks/'); return i === -1 ? null : url.slice(i + 10); };

  async function loadUploads() {
    if (!G.Auth.member) { uploads = []; return; }
    const { data, error } = await G.sb.from('artworks')
      .select('id,slug,title,category,image_path')
      .eq('user_id', G.Auth.member.id).order('created_at', { ascending: false });
    if (!error && data) uploads = data.map(w => ({ id: w.id, slug: w.slug, title: w.title, cat: w.category, img: w.image_path }));
  }

  function renderUploads() {
    const strip = $('#uploadStrip');
    if (!uploads.length) { strip.innerHTML = ''; return; }
    strip.innerHTML = `
      <div style="margin-bottom:30px">
        <span class="eyebrow" style="margin-bottom:14px">Your uploads (${uploads.length})</span>
        <div class="feat-row" style="margin-top:16px">
          ${uploads.map((u) => `
            <div class="art-card">
              <button class="fav-btn on" data-del-upload="${u.id}" aria-label="Delete upload" title="Delete">✕</button>
              <div class="art-frame"><img src="${u.img}" alt="${esc(u.title)}" loading="lazy"></div>
              <div class="art-caption">
                <div><div class="t">${esc(u.title)}</div><div class="a">You · ${esc(u.cat)}</div></div>
                <div class="p">♥ 0</div>
              </div>
            </div>`).join('')}
        </div>
      </div>`;
    /* size each frame to its image's natural aspect ratio once it loads */
    strip.querySelectorAll('.art-frame img').forEach(im => {
      const set = () => { if (im.naturalWidth) im.parentElement.style.aspectRatio = im.naturalWidth + ' / ' + im.naturalHeight; };
      im.complete ? set() : im.addEventListener('load', set, { once: true });
    });
  }
  $('#uploadStrip').addEventListener('click', async (e) => {
    const del = e.target.closest('[data-del-upload]');
    if (!del) return;
    const id = del.dataset.delUpload;
    const u = uploads.find(x => x.id === id);
    if (!u) return;
    del.disabled = true;
    const { error } = await G.sb.from('artworks').delete().eq('id', id);
    if (error) { del.disabled = false; G.toast('Could not remove that upload — try again.'); return; }
    const path = storagePath(u.img);
    if (path) await G.sb.storage.from('artworks').remove([path]);
    uploads = uploads.filter(x => x.id !== id);
    renderUploads();
    G.toast('Upload removed.');
  });

  $('#uploadOpen').addEventListener('click', () => {
    if (!G.Auth.member) {
      G.toast('Sign in to post your art — membership is free.');
      setTimeout(() => location.href = 'auth.html?mode=register', 900);
      return;
    }
    uploadModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
  const closeUpload = () => { uploadModal.classList.remove('open'); document.body.style.overflow = ''; };
  uploadModal.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-u-close') && !e.target.closest('.reader-card')) closeUpload();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && uploadModal.classList.contains('open')) closeUpload();
  });

  const slugify = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) + '-' + Date.now().toString(36);

  $('#uploadForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#upTitle'), file = $('#upFile');
    const mark = (el, ok) => { el.closest('.field').classList.toggle('invalid', !ok); return ok; };
    const ok = [mark(title, title.value.trim().length >= 2), mark(file, file.files.length > 0)].every(Boolean);
    if (!ok) return;
    if (!G.Auth.member) { G.toast('Please sign in first.'); return; }
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * scale);
      cv.height = Math.round(img.height * scale);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(img.src);
      cv.toBlob(async (blob) => {
        if (!blob) { G.toast('That image could not be processed.'); return; }
        const btn = $('#uploadForm').querySelector('button[type=submit]'); if (btn) btn.disabled = true;
        const uid = G.Auth.member.id;
        const t = title.value.trim();
        const path = `${uid}/${Date.now()}.jpg`;
        const up = await G.sb.storage.from('artworks').upload(path, blob, { contentType: 'image/jpeg' });
        if (up.error) { if (btn) btn.disabled = false; G.toast('Upload failed — try again.'); return; }
        const publicUrl = G.sb.storage.from('artworks').getPublicUrl(path).data.publicUrl;
        const ins = await G.sb.from('artworks')
          .insert({ user_id: uid, title: t, image_path: publicUrl, category: $('#upCat').value, slug: slugify(t) })
          .select('id,slug,title,category,image_path').single();
        if (btn) btn.disabled = false;
        if (ins.error) { await G.sb.storage.from('artworks').remove([path]); G.toast('Could not save your artwork — try again.'); return; }
        uploads.unshift({ id: ins.data.id, slug: ins.data.slug, title: ins.data.title, cat: ins.data.category, img: ins.data.image_path });
        $('#uploadForm').reset();
        closeUpload();
        renderUploads();
        G.toast('Published! Your piece is now in your gallery.');
        window.scrollTo({ top: $('#uploadStrip').offsetTop - 120, behavior: 'smooth' });
      }, 'image/jpeg', 0.82);
    };
    img.onerror = () => G.toast('That file does not look like an image.');
    img.src = URL.createObjectURL(file.files[0]);
  });

  /* ---------------- boot ---------------- */
  update();
  loadUploads().then(renderUploads);
  const deep = new URLSearchParams(location.search).get('art');
  if (deep && D.artworkById[deep]) setTimeout(() => openLightbox(deep, false), 250);
  });
})();
