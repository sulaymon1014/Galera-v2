/* GALERA — account dashboard (auth via Supabase; other data still local for now) */
(function () {
  'use strict';
  const D = window.GALERA, G = window.Galera, esc = G.esc, sb = G.sb;
  const $ = (s) => document.querySelector(s);

  Promise.all([G.Auth.ready, window.GALERA.ready]).then(async ([user]) => {
    if (!user) { location.replace('auth.html'); return; }

    const name0 = G.displayName(user);
    const email0 = user.email || '';
    const since0 = user.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear();
    const prefs = G.store.get('galera_profile', {}) || {};

    /* artist state: the profile row + this user's tiers (empty for non-artists) */
    const [profRes, tiersRes] = await Promise.all([
      sb.from('profiles').select('is_artist,handle,tagline,bio,statement,avatar_url,cover_url').eq('id', user.id).single(),
      sb.from('tiers').select('id,tier_key,name,price_cents,blurb,perks,featured,sort').eq('artist_id', user.id).order('sort')
    ]);
    const prof = profRes.data || {};
    const myTiers = tiersRes.data || [];

    $('#accTitle').innerHTML = `Hello, <span class="italic gold">${esc(name0.split(' ')[0])}.</span>`;
    $('#accSub').textContent = `Member since ${since0} · ${esc(email0)}`;

    const favs = G.Favs.all();
    const favWorks = favs.map(id => D.artworkByUid[id]).filter(Boolean);
    const pledgeRows = G.Members.all().map(([artistUid, tierUid]) => {
      const a = D.ARTISTS.find(x => x.uid === artistUid);
      const t = a && a.tiers.find(x => x.uid === tierUid);
      return a && t ? { a, t } : null;
    }).filter(Boolean);
    const monthly = pledgeRows.reduce((s, p) => s + (p.t.price || 0), 0);
    const followed = G.Follows.all().map(fid => D.ARTISTS.find(x => x.uid === fid)).filter(Boolean);

    const artistCardHtml = () => prof.is_artist ? `
      <div class="dash-card reveal" id="artistCard" style="grid-column:1/-1">
        <h3 class="serif">Artist studio <span class="gold" style="font-size:.8rem">@${esc(prof.handle || '')}</span></h3>
        <div style="display:flex; flex-wrap:wrap; gap:10px;">
          <a class="btn btn-sm btn-solid" href="artist.html?a=${esc(prof.handle || '')}">View my public page</a>
          <a class="btn btn-sm" href="gallery.html">Upload work</a>
        </div>
        <hr class="hr">
        <div style="display:grid; gap:14px;">
          <span class="eyebrow" style="font-size:.62rem">Your artist profile</span>
          <div class="field"><label for="arTagline">Tagline</label>
            <input id="arTagline" type="text" maxlength="80" value="${esc(prof.tagline || '')}" placeholder="e.g. Painted light & long stories"></div>
          <div class="field"><label for="arBio">Bio</label>
            <textarea id="arBio" rows="3" placeholder="A sentence or two about you and your work.">${esc(prof.bio || '')}</textarea></div>
          <div class="field"><label for="arStatement">Statement</label>
            <textarea id="arStatement" rows="2" placeholder="A short line pulled out as a quote on your page.">${esc(prof.statement || '')}</textarea></div>
          <div style="display:flex; flex-wrap:wrap; gap:16px;">
            <div class="field" style="flex:1; min-width:160px"><label for="arAvatar">Replace avatar (optional)</label><input id="arAvatar" type="file" accept="image/*"></div>
            <div class="field" style="flex:1; min-width:160px"><label for="arCover">Replace cover (optional)</label><input id="arCover" type="file" accept="image/*"></div>
          </div>
          <button class="btn btn-sm btn-solid" id="arSave" style="justify-self:start">Save artist profile</button>
        </div>
        <hr class="hr">
        <div style="display:grid; gap:14px;">
          <span class="eyebrow" style="font-size:.62rem">Support tiers</span>
          <div id="tierList" style="display:grid; gap:10px;"></div>
          <details>
            <summary style="cursor:pointer; color:var(--gold); font-size:.85rem">+ Add a tier</summary>
            <div style="display:grid; gap:12px; margin-top:14px;">
              <div style="display:flex; gap:12px; flex-wrap:wrap;">
                <div class="field" style="flex:2; min-width:160px"><label for="tName">Name</label><input id="tName" type="text" maxlength="40" placeholder="e.g. Studio"></div>
                <div class="field" style="flex:1; min-width:100px"><label for="tPrice">Price $/mo</label><input id="tPrice" type="number" min="1" max="999" placeholder="8"></div>
              </div>
              <div class="field"><label for="tBlurb">Blurb</label><input id="tBlurb" type="text" maxlength="120" placeholder="What this tier is about."></div>
              <div class="field"><label for="tPerks">Perks (one per line)</label><textarea id="tPerks" rows="3" placeholder="4K downloads&#10;Layered PSDs&#10;Monthly process video"></textarea></div>
              <button class="btn btn-sm btn-solid" id="tAdd" style="justify-self:start">Add tier</button>
            </div>
          </details>
        </div>
      </div>` : `
      <div class="dash-card reveal" id="artistCard" style="grid-column:1/-1; border-color:var(--gold-dim)">
        <h3 class="serif">Become an artist</h3>
        <p class="dim" style="font-size:.9rem">Open your own page, upload your work, and let people support you. Any member can — it's free, and you keep 92% of every pledge.</p>
        <button class="btn btn-sm btn-solid" id="beArtistBtn">Set up my artist page</button>
        <div id="beArtistForm" hidden style="display:grid; gap:14px; margin-top:16px;">
          <div class="field"><label for="baHandle">Handle (your page address)</label>
            <input id="baHandle" type="text" maxlength="30" placeholder="e.g. ada-lovelace" autocomplete="off">
            <span class="hint" id="baHandleHint">Lowercase letters, numbers and dashes. This becomes artist.html?a=…</span></div>
          <div class="field"><label for="baTagline">Tagline</label>
            <input id="baTagline" type="text" maxlength="80" placeholder="e.g. Painted light & long stories"></div>
          <div class="field"><label for="baBio">Bio</label>
            <textarea id="baBio" rows="3" placeholder="A sentence or two about you and your work."></textarea></div>
          <div class="field"><label for="baStatement">Statement (optional)</label>
            <textarea id="baStatement" rows="2" placeholder="A short line pulled out as a quote on your page."></textarea></div>
          <div style="display:flex; flex-wrap:wrap; gap:16px;">
            <div class="field" style="flex:1; min-width:160px"><label for="baAvatar">Avatar (optional)</label><input id="baAvatar" type="file" accept="image/*"></div>
            <div class="field" style="flex:1; min-width:160px"><label for="baCover">Cover (optional)</label><input id="baCover" type="file" accept="image/*"></div>
          </div>
          <button class="btn btn-sm btn-solid" id="baSubmit" style="justify-self:start">Publish my artist page</button>
        </div>
      </div>`;

    $('#dashGrid').innerHTML = `
      ${artistCardHtml()}
      ${G.Auth.recovery ? `
      <div class="dash-card reveal" style="border-color:var(--gold)">
        <h3 class="serif">Set a new password</h3>
        <p class="dim" style="font-size:.88rem">You arrived from a password-reset link. Choose a new password to finish — you're already signed in.</p>
        <div class="field">
          <label for="rcPass">New password</label>
          <input id="rcPass" type="password" autocomplete="new-password" placeholder="8+ characters">
        </div>
        <button class="btn btn-sm btn-solid" id="rcSave">Update password</button>
      </div>` : ''}
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
        <h3 class="serif">Following <span class="gold" style="font-size:.85rem">${followed.length || ''}</span></h3>
        ${followed.length ? followed.map(f => `
          <div style="display:flex; align-items:center; gap:12px;">
            <img src="${f.avatar}" alt="" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:1px solid var(--line);">
            <div style="flex:1">
              <strong style="font-size:.95rem">${esc(f.name)}</strong>
              <p class="dim" style="font-size:.8rem">${esc(f.practice)}</p>
            </div>
            <a class="btn btn-sm" href="artist.html?a=${f.id}">View</a>
          </div>`).join('<hr class="hr">') : `
          <p class="dim" style="font-size:.88rem">You’re not following anyone yet. Follow an artist and their new work will find you.</p>
          <a class="btn btn-sm btn-solid" href="artists.html">Browse artists</a>`}
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

    /* ---------------- artist onboarding + studio ---------------- */
    const slugHandle = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);

    function resizeToBlob(file, max) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const cv = document.createElement('canvas');
          cv.width = Math.round(img.width * scale); cv.height = Math.round(img.height * scale);
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          URL.revokeObjectURL(img.src);
          cv.toBlob(b => b ? resolve(b) : reject(new Error('Could not process that image.')), 'image/jpeg', 0.85);
        };
        img.onerror = () => reject(new Error('That file does not look like an image.'));
        img.src = URL.createObjectURL(file);
      });
    }
    async function uploadImage(file, kind, max) {
      const blob = await resizeToBlob(file, max);
      const path = `${user.id}/${kind}-${Date.now()}.jpg`;
      const up = await sb.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg' });
      if (up.error) throw up.error;
      return sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    }

    /* become an artist */
    const beBtn = $('#beArtistBtn');
    if (beBtn) {
      beBtn.addEventListener('click', () => { $('#beArtistForm').hidden = false; beBtn.hidden = true; $('#baHandle').focus(); });
      $('#baHandle').addEventListener('input', (e) => { const c = slugHandle(e.target.value); if (e.target.value !== c) e.target.value = c; });
      $('#baSubmit').addEventListener('click', async () => {
        const handle = slugHandle($('#baHandle').value);
        const tagline = $('#baTagline').value.trim();
        const bio = $('#baBio').value.trim();
        const statement = $('#baStatement').value.trim();
        if (handle.length < 3) { G.toast('Pick a handle of at least 3 characters.'); return; }
        if (tagline.length < 2) { G.toast('Add a short tagline.'); return; }
        const btn = $('#baSubmit'); btn.disabled = true;
        try {
          const taken = await sb.from('profiles').select('id').eq('handle', handle).neq('id', user.id);
          if (taken.data && taken.data.length) { G.toast('That handle is taken — try another.'); btn.disabled = false; return; }
          const patch = { is_artist: true, handle, tagline, bio, statement };
          const av = $('#baAvatar').files[0], cv = $('#baCover').files[0];
          if (av) patch.avatar_url = await uploadImage(av, 'avatar', 512);
          if (cv) patch.cover_url = await uploadImage(cv, 'cover', 1600);
          const { error } = await sb.from('profiles').update(patch).eq('id', user.id);
          if (error) throw error;
          G.toast('Welcome — your artist page is live.');
          setTimeout(() => location.href = 'artist.html?a=' + handle, 900);
        } catch (err) { btn.disabled = false; G.toast((err && err.message) || 'Could not set up your page — try again.'); }
      });
    }

    /* artist studio: save profile */
    const arSave = $('#arSave');
    if (arSave) arSave.addEventListener('click', async () => {
      arSave.disabled = true;
      try {
        const patch = { tagline: $('#arTagline').value.trim(), bio: $('#arBio').value.trim(), statement: $('#arStatement').value.trim() };
        const av = $('#arAvatar').files[0], cv = $('#arCover').files[0];
        if (av) patch.avatar_url = await uploadImage(av, 'avatar', 512);
        if (cv) patch.cover_url = await uploadImage(cv, 'cover', 1600);
        const { error } = await sb.from('profiles').update(patch).eq('id', user.id);
        if (error) throw error;
        G.toast('Artist profile saved.');
        setTimeout(() => location.reload(), 700);
      } catch (err) { arSave.disabled = false; G.toast((err && err.message) || 'Could not save — try again.'); }
    });

    /* artist studio: tiers */
    const tierList = $('#tierList');
    function renderTiers() {
      if (!tierList) return;
      tierList.innerHTML = myTiers.length ? myTiers.map(t => `
        <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--line-soft);">
          <div style="flex:1">
            <strong style="font-size:.9rem">${esc(t.name)}</strong><span class="gold" style="font-size:.82rem"> · $${Math.round(t.price_cents / 100)}/mo</span>
            ${t.blurb ? `<p class="dim" style="font-size:.78rem">${esc(t.blurb)}</p>` : ''}
          </div>
          <button class="btn btn-sm" data-del-tier="${t.id}" style="border-color:rgba(224,104,126,.5); color:#e88596">Delete</button>
        </div>`).join('')
        : `<p class="dim" style="font-size:.82rem">No tiers yet — add one so people can support you.</p>`;
      tierList.querySelectorAll('[data-del-tier]').forEach(b => b.addEventListener('click', async () => {
        b.disabled = true;
        const { error } = await sb.from('tiers').delete().eq('id', b.dataset.delTier);
        if (error) { b.disabled = false; G.toast('Could not delete the tier — try again.'); return; }
        const i = myTiers.findIndex(x => x.id === b.dataset.delTier);
        if (i !== -1) myTiers.splice(i, 1);
        renderTiers();
        G.toast('Tier removed.');
      }));
    }
    renderTiers();
    const tAdd = $('#tAdd');
    if (tAdd) tAdd.addEventListener('click', async () => {
      const name = $('#tName').value.trim();
      const price = parseInt($('#tPrice').value, 10);
      const blurb = $('#tBlurb').value.trim();
      const perks = $('#tPerks').value.split('\n').map(s => s.trim()).filter(Boolean);
      if (name.length < 2) { G.toast('Give the tier a name.'); return; }
      if (!(price >= 1)) { G.toast('Set a monthly price of at least $1.'); return; }
      const tier_key = slugHandle(name) || ('tier-' + Date.now().toString(36));
      tAdd.disabled = true;
      const { data, error } = await sb.from('tiers')
        .insert({ artist_id: user.id, tier_key, name, price_cents: price * 100, blurb, perks, sort: myTiers.length })
        .select('id,tier_key,name,price_cents,blurb,perks,featured,sort').single();
      tAdd.disabled = false;
      if (error) { G.toast(error.code === '23505' ? 'You already have a tier with a similar name.' : 'Could not add the tier — try again.'); return; }
      myTiers.push(data);
      renderTiers();
      ['tName', 'tPrice', 'tBlurb', 'tPerks'].forEach(id => { $('#' + id).value = ''; });
      G.toast('Tier added.');
    });

    /* actions */
    const rcSave = $('#rcSave');
    if (rcSave) rcSave.addEventListener('click', async () => {
      const p = $('#rcPass').value;
      if (p.length < 8) { G.toast('Use at least 8 characters — a phrase beats a puzzle.'); return; }
      rcSave.disabled = true;
      const { error } = await sb.auth.updateUser({ password: p });
      rcSave.disabled = false;
      if (error) { G.toast(error.message || 'Could not update the password.'); return; }
      G.Auth.recovery = false;
      history.replaceState(null, '', location.pathname);
      G.toast('Password updated — you are signed in.');
      setTimeout(() => location.reload(), 800);
    });

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
        favourites: favs,
        memberships: G.Members.all(),
        likes: G.Likes.all(),
        follows: G.Follows.all(),
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
