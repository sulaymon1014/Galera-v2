/* GALERA — account dashboard (auth via Supabase; other data still local for now) */
(function () {
  'use strict';
  const D = window.GALERA, G = window.Galera, esc = G.esc, sb = G.sb;
  const $ = (s) => document.querySelector(s);

  G.Auth.ready.then((user) => {
    if (!user) { location.replace('auth.html'); return; }

    const name0 = G.displayName(user);
    const email0 = user.email || '';
    const since0 = user.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear();
    const prefs = G.store.get('galera_profile', {}) || {};

    $('#accTitle').innerHTML = `Hello, <span class="italic gold">${esc(name0.split(' ')[0])}.</span>`;
    $('#accSub').textContent = `Member since ${since0} · ${esc(email0)}`;

    const favs = G.Favs.all();
    const favWorks = favs.map(id => D.artworkById[id]).filter(Boolean);
    const pledges = G.store.get('galera_pledges', {});
    const pledgeRows = Object.entries(pledges).map(([aid, tid]) => {
      const a = D.artistById[aid];
      const t = a && D.tiersFor(aid).find(x => x.id === tid);
      return a && t ? { a, t } : null;
    }).filter(Boolean);
    const monthly = pledgeRows.reduce((s, p) => s + (p.t.price || 0), 0);

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
          <input id="pfName" type="text" value="${esc(name0)}">
        </div>
        <div class="field">
          <label for="pfEmail">Email</label>
          <input id="pfEmail" type="email" value="${esc(email0)}" disabled>
          <span class="hint">Email is your sign-in identity.</span>
        </div>
        <button class="btn btn-sm btn-solid" id="saveProfile">Save changes</button>
      </div>

      <div class="dash-card reveal" data-delay="1">
        <h3 class="serif">Security</h3>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:14px;">
          <div><strong style="font-size:.95rem">Two-factor authentication</strong>
          <p class="dim" style="font-size:.82rem; margin-top:4px">Over 99.9% of compromised accounts had no second factor. Turn it on.</p></div>
          <label class="toggle"><input type="checkbox" id="mfaToggle" ${prefs.mfa ? 'checked' : ''}><span class="track"></span></label>
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
          <p class="dim" style="font-size:.82rem; margin:6px 0 12px">Export what’s stored on this device, or sign out and clear it.</p>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn btn-sm" id="exportData">Export my data</button>
            <button class="btn btn-sm" id="deleteAccount" style="border-color:rgba(224,104,126,.5); color:#e88596">Clear &amp; sign out</button>
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
    $('#saveProfile').addEventListener('click', async () => {
      const name = $('#pfName').value.trim();
      if (name.length < 2) { G.toast('A name needs at least two letters.'); return; }
      const { error } = await sb.auth.updateUser({ data: { name, full_name: name } });
      if (error) { G.toast(error.message || 'Could not save.'); return; }
      await sb.from('profiles').update({ name }).eq('id', user.id);
      G.toast('Profile saved.');
      setTimeout(() => location.reload(), 700);
    });
    $('#mfaToggle').addEventListener('change', (e) => {
      G.store.set('galera_profile', { ...prefs, mfa: e.target.checked });
      G.toast(e.target.checked ? 'Two-factor authentication enabled. Wise.' : 'Two-factor authentication disabled.');
    });
    $('#addPasskey').addEventListener('click', () => G.toast('Passkeys (WebAuthn) are coming soon.'));
    $('#prefPreview').addEventListener('change', (e) => G.toast(e.target.checked ? 'Preview alerts on.' : 'Preview alerts off.'));
    $('#prefLetter').addEventListener('change', (e) => G.toast(e.target.checked ? 'The Friday Drop will arrive Fridays.' : 'Unsubscribed from the drop.'));
    $('#exportData').addEventListener('click', () => {
      const data = {
        account: { name: name0, email: email0, id: user.id },
        favourites: favs, memberships: pledges,
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
      G.toast('Your data, exported.');
    });
    $('#deleteAccount').addEventListener('click', async () => {
      if (!confirm('Sign out and clear all locally stored Galera data on this device?')) return;
      ['galera_profile', 'galera_favs', 'galera_posts', 'galera_likes',
       'galera_pledges', 'galera_art_likes', 'galera_uploads'].forEach(k => G.store.del(k));
      await G.Auth.signOut();
      location.href = 'index.html';
    });
    $('#signOut').addEventListener('click', async () => {
      await G.Auth.signOut();
      G.toast('Signed out. The gallery remains open to you.');
      setTimeout(() => location.href = 'index.html', 500);
    });

    G.watchReveals();
  });
})();
