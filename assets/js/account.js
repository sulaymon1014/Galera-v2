/* GALERA — account dashboard */
(function () {
  'use strict';
  const D = window.GALERA, G = window.Galera, esc = G.esc;
  const $ = (s) => document.querySelector(s);
  const member = G.Auth.member;

  if (!member) { location.replace('auth.html'); return; }

  $('#accTitle').innerHTML = `Hello, <span class="italic gold">${esc(member.name.split(' ')[0])}.</span>`;
  $('#accSub').textContent = `Member since ${member.since} · ${esc(member.email)}`;

  const favs = G.Favs.all();
  const favWorks = favs.map(id => D.artworkById[id]).filter(Boolean);
  const pledges = G.store.get('galera_pledges', {});
  const pledgeRows = Object.entries(pledges).map(([aid, tid]) => {
    const a = D.artistById[aid], t = D.TIERS.find(x => x.id === tid);
    return a && t ? { a, t } : null;
  }).filter(Boolean);
  const monthly = pledgeRows.reduce((s, p) => s + p.t.price, 0);

  $('#dashGrid').innerHTML = `
    <div class="dash-card reveal">
      <h3 class="serif">Memberships <span class="gold" style="font-size:.85rem">$${monthly}/mo</span></h3>
      ${pledgeRows.length ? pledgeRows.map(p => `
        <div style="display:flex; align-items:center; gap:12px;">
          <img src="${p.a.avatar}" alt="" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:1px solid var(--line);">
          <div style="flex:1">
            <strong style="font-size:.95rem">${esc(p.a.name)}</strong>
            <p class="dim" style="font-size:.8rem">${p.t.name} tier · $${p.t.price}/mo</p>
          </div>
          <a class="btn btn-sm" href="artist.html?a=${p.a.id}#tiers">Manage</a>
        </div>`).join('<hr class="hr">') : `
        <p class="dim" style="font-size:.88rem">You’re not supporting anyone yet. Pick one artist whose work you’d miss — depth beats breadth.</p>
        <a class="btn btn-sm btn-solid" href="artists.html">Find your artist</a>`}
    </div>

    <div class="dash-card reveal">
      <h3 class="serif">Profile</h3>
      <div class="field">
        <label for="pfName">Display name</label>
        <input id="pfName" type="text" value="${esc(member.name)}">
      </div>
      <div class="field">
        <label for="pfEmail">Email</label>
        <input id="pfEmail" type="email" value="${esc(member.email)}" disabled>
        <span class="hint">Email is your sign-in identity (demo).</span>
      </div>
      <button class="btn btn-sm btn-solid" id="saveProfile">Save changes</button>
    </div>

    <div class="dash-card reveal" data-delay="1">
      <h3 class="serif">Security</h3>
      <div style="display:flex; justify-content:space-between; align-items:center; gap:14px;">
        <div><strong style="font-size:.95rem">Two-factor authentication</strong>
        <p class="dim" style="font-size:.82rem; margin-top:4px">Over 99.9% of compromised accounts had no second factor. Turn it on.</p></div>
        <label class="toggle"><input type="checkbox" id="mfaToggle" ${member.mfa ? 'checked' : ''}><span class="track"></span></label>
      </div>
      <hr class="hr">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:14px;">
        <div><strong style="font-size:.95rem">Passkey</strong>
        <p class="dim" style="font-size:.82rem; margin-top:4px">Sign in with your device instead of a password.</p></div>
        <button class="btn btn-sm" id="addPasskey">Add</button>
      </div>
      <hr class="hr">
      <button class="btn btn-sm" id="signOut">Sign out</button>
    </div>

    <div class="dash-card reveal" data-delay="2">
      <h3 class="serif">Preferences</h3>
      <div style="display:flex; justify-content:space-between; align-items:center; gap:14px;">
        <div><strong style="font-size:.95rem">New drop alerts</strong>
        <p class="dim" style="font-size:.82rem; margin-top:4px">When artists you support post new work.</p></div>
        <label class="toggle"><input type="checkbox" id="prefPreview" checked><span class="track"></span></label>
      </div>
      <hr class="hr">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:14px;">
        <div><strong style="font-size:.95rem">The Friday Drop</strong>
        <p class="dim" style="font-size:.82rem; margin-top:4px">The week’s works and one process breakdown.</p></div>
        <label class="toggle"><input type="checkbox" id="prefLetter" checked><span class="track"></span></label>
      </div>
      <hr class="hr">
      <div>
        <strong style="font-size:.95rem">Your data</strong>
        <p class="dim" style="font-size:.82rem; margin:6px 0 12px">Export or erase everything we hold about you — GDPR rights, honoured in one click.</p>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn btn-sm" id="exportData">Export my data</button>
          <button class="btn btn-sm" id="deleteAccount" style="border-color:rgba(179,73,46,.5); color:#e08568">Delete account</button>
        </div>
      </div>
    </div>`;

  /* favourites */
  const favGrid = $('#favGrid');
  $('#favHeading').textContent = favWorks.length ? `Works you’ve saved (${favWorks.length})` : 'Works you’ve saved';
  $('#favEmpty').hidden = favWorks.length > 0;
  favGrid.innerHTML = favWorks.map((w, i) => `
    <a class="art-card reveal" data-delay="${i % 3}" href="gallery.html?art=${w.id}">
      <div class="art-frame">
        ${w.premium ? '<span class="badge-premium">◆ Supporters</span>' : ''}
        <img src="${w.img}" alt="${esc(w.alt)}" loading="lazy">
        <div class="art-hover"><span class="view-tag">View work</span></div>
      </div>
      <div class="art-caption">
        <div><div class="t">${esc(w.title)}</div><div class="a">${esc(D.artistById[w.artist].name)} · ${esc(w.cat)}</div></div>
        <div class="p">♥ ${D.fmtCount(w.likes)}</div>
      </div>
    </a>`).join('');

  /* actions */
  $('#saveProfile').addEventListener('click', () => {
    const name = $('#pfName').value.trim();
    if (name.length < 2) { G.toast('A name needs at least two letters.'); return; }
    G.Auth.signIn({ ...member, name });
    G.store.set('galera_profile', { ...(G.store.get('galera_profile', {}) || {}), name });
    G.toast('Profile saved.');
    setTimeout(() => location.reload(), 700);
  });
  $('#mfaToggle').addEventListener('change', (e) => {
    G.Auth.signIn({ ...member, mfa: e.target.checked });
    G.store.set('galera_profile', { ...(G.store.get('galera_profile', {}) || {}), mfa: e.target.checked });
    G.toast(e.target.checked ? 'Two-factor authentication enabled. Wise.' : 'Two-factor authentication disabled.');
  });
  $('#addPasskey').addEventListener('click', () => G.toast('In production this would register a WebAuthn passkey on your device. (Demo)'));
  $('#prefPreview').addEventListener('change', (e) => G.toast(e.target.checked ? 'Preview alerts on.' : 'Preview alerts off.'));
  $('#prefLetter').addEventListener('change', (e) => G.toast(e.target.checked ? 'The Sunday Letter will arrive Sundays.' : 'Unsubscribed from the letter.'));
  $('#exportData').addEventListener('click', () => {
    const data = {
      member, favourites: favs,
      memberships: pledges,
      likes: G.store.get('galera_art_likes', []),
      posts: G.store.get('galera_posts', {}),
      consent: G.store.get('galera_consent', null)
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'galera-my-data.json';
    a.click();
    URL.revokeObjectURL(a.href);
    G.toast('Your data, exported. All of it.');
  });
  $('#deleteAccount').addEventListener('click', () => {
    if (!confirm('Delete your Galera membership and all locally stored data? This cannot be undone.')) return;
    ['galera_member', 'galera_profile', 'galera_favs', 'galera_posts', 'galera_likes',
     'galera_pledges', 'galera_art_likes', 'galera_uploads'].forEach(k => G.store.del(k));
    location.href = 'index.html';
  });
  $('#signOut').addEventListener('click', () => {
    G.Auth.signOut();
    G.toast('Signed out. The gallery remains open to you.');
    setTimeout(() => location.href = 'index.html', 700);
  });

  G.watchReveals();
})();
