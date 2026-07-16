/* GALERA — community: gated for guests, live forum for members */
(function () {
  'use strict';
  const D = window.GALERA, G = window.Galera, esc = G.esc;
  const $ = (s, el) => (el || document).querySelector(s);
  const member = G.Auth.member;
  const body = $('#communityBody');

  /* member-added replies live in localStorage, keyed by thread id */
  const extraPosts = G.store.get('galera_posts', {});
  const likes = G.store.get('galera_likes', []);

  const threadRow = (t) => `
    <div class="thread" data-thread="${t.id}" role="button" tabindex="0" aria-label="Open thread: ${esc(t.title)}">
      <div>
        <span class="sec">${esc(t.section)}</span>${t.pinned ? '<span class="pin-tag">Pinned</span>' : ''}
        <h3>${esc(t.title)}</h3>
        <p class="prev">${esc(t.preview)}</p>
      </div>
      <div class="stats">
        <span><strong>${t.replies + ((extraPosts[t.id] || []).length)}</strong> replies</span>
        <span><strong>${t.likes}</strong> appreciations</span>
        <span>${esc(t.author)} · ${esc(t.when)}</span>
      </div>
    </div>`;

  if (member) {
    /* ------------- member view ------------- */
    $('#commTitle').innerHTML = `Welcome back,<br><span class="italic gold">${esc(member.name.split(' ')[0])}.</span>`;
    $('#commLede').textContent = 'The room is open. Six conversations are moving today — the weekly WIP thread is filling up, and the critique lounge has a lighting study that needs your eyes.';
    body.innerHTML = `
      <div class="section-head reveal">
        <div class="stack">
          <span class="eyebrow">Today in the forum</span>
          <h2>Conversations in progress</h2>
        </div>
        <a class="btn btn-sm" href="account.html">My account</a>
      </div>
      <div class="thread-list reveal" data-delay="1">
        ${D.THREADS.map(threadRow).join('')}
      </div>`;
  } else {
    /* ------------- guest view: teaser + veil ------------- */
    body.innerHTML = `
      <div class="locked-banner reveal">
        <span class="eyebrow">Gated, gently</span>
        <h3 class="serif" style="font-size:clamp(1.4rem,2.4vw,1.9rem)">The forum is members-only. Membership is free.</h3>
        <p class="dim" style="max-width:60ch">Register with an email — or a social account — and the full community opens: every thread, the critique lounge, the weekly WIP ritual, and honest advice from working artists.</p>
        <div style="display:flex; flex-wrap:wrap; gap:12px;">
          <a class="btn btn-solid" href="auth.html?mode=register">Become a member — free</a>
          <a class="btn" href="auth.html">I already have an account</a>
        </div>
      </div>

      <div style="margin-top:clamp(48px,7vw,80px)" class="reveal">
        <div class="section-head">
          <div class="stack">
            <span class="eyebrow">A glimpse inside</span>
            <h2>Top discussions this week</h2>
          </div>
        </div>
        <div class="thread-list">${D.THREADS.slice(0, 2).map(threadRow).join('')}</div>
        <div class="locked-veil" style="margin-top:0">
          <div class="thread-list veiled" aria-hidden="true">${D.THREADS.slice(2, 5).map(threadRow).join('')}</div>
          <div class="veil-cta">
            <h3 class="serif" style="font-size:clamp(1.3rem,2.2vw,1.7rem)">…and ${D.THREADS.length - 2} more conversations behind the door.</h3>
            <div><a class="btn btn-solid" href="auth.html?mode=register">Open the door</a></div>
          </div>
        </div>
      </div>

      <div style="margin-top:clamp(48px,7vw,80px)" class="reveal">
        <div class="section-head">
          <div class="stack">
            <span class="eyebrow">Member voices</span>
            <h2>Why people stay</h2>
          </div>
        </div>
        <div class="review-rail">
          ${D.REVIEWS.slice(0, 4).map(r => `
            <figure class="review-card">
              <div>
                <div class="stars" aria-label="Five stars">★★★★★</div>
                <blockquote class="text" style="margin-top:14px">“${esc(r.text)}”</blockquote>
              </div>
              <figcaption class="who"><strong>${esc(r.name)}</strong>${esc(r.role)}</figcaption>
            </figure>`).join('')}
        </div>
      </div>`;
  }

  /* ------------- thread overlay (members; guests get first 2) ------------- */
  const overlay = $('#threadOverlay');
  const card = $('#threadCard');

  function avatarOf(name) { return esc(name.trim()[0].toUpperCase()); }

  function postHtml(p, tid, idx) {
    const key = `${tid}:${idx}`;
    const liked = likes.includes(key);
    return `
      <div class="post">
        <span class="avatar" aria-hidden="true">${avatarOf(p.author)}</span>
        <div>
          <div class="head"><strong>${esc(p.author)}</strong><time>${esc(p.when)}</time></div>
          <p class="body">${esc(p.text)}</p>
          <div class="post-actions">
            <button data-like="${key}" class="${liked ? 'on' : ''}">${liked ? '♥ Appreciated' : '♡ Appreciate'}</button>
            <button data-report>⚑ Report</button>
          </div>
        </div>
      </div>`;
  }

  function openThread(id) {
    const t = D.THREADS.find(x => x.id === id);
    if (!t) return;
    const guestAllowed = D.THREADS.slice(0, 2).some(x => x.id === id);
    if (!member && !guestAllowed) { location.href = 'auth.html?mode=register'; return; }

    const mine = extraPosts[id] || [];
    card.innerHTML = `
      <span class="eyebrow">${esc(t.section)}</span>
      <h2 class="serif" style="font-size:clamp(1.5rem,2.8vw,2.2rem)">${esc(t.title)}</h2>
      <div>
        ${t.posts.map((p, i) => postHtml(p, id, i)).join('')}
        ${mine.map((p, i) => postHtml(p, id, t.posts.length + i)).join('')}
      </div>
      ${member ? `
      <form class="composer" id="composer">
        <label class="eyebrow" style="font-size:.62rem" for="composeText">Add your voice</label>
        <textarea id="composeText" placeholder="Critique the work, never the person…" required></textarea>
        <div style="display:flex; justify-content:space-between; gap:12px; align-items:center;">
          <span class="dim" style="font-size:.78rem">Posting as <strong>${esc(member.name)}</strong> · stored only in this browser (demo)</span>
          <button class="btn btn-solid btn-sm" type="submit">Post reply</button>
        </div>
      </form>` : `
      <div class="locked-banner" style="margin-top:10px">
        <p class="dim">You’re reading as a guest. <a class="gold" href="auth.html?mode=register">Become a member</a> to reply, appreciate, and see every thread.</p>
      </div>`}`;

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    overlay.querySelector('.reader-panel').scrollTop = 0;

    const form = $('#composer', card);
    if (form) form.addEventListener('submit', (e) => {
      e.preventDefault();
      const txt = $('#composeText', card).value.trim();
      if (txt.length < 3) { G.toast('A little more, perhaps — three characters is a sneeze.'); return; }
      const post = { author: member.name, when: 'Just now', text: txt };
      extraPosts[id] = (extraPosts[id] || []).concat(post);
      G.store.set('galera_posts', extraPosts);
      G.toast('Posted. The room heard you.');
      openThread(id);
    });
  }

  function closeThread() { overlay.classList.remove('open'); document.body.style.overflow = ''; }

  document.addEventListener('click', (e) => {
    const row = e.target.closest('[data-thread]');
    if (row && !row.closest('.veiled')) { openThread(row.dataset.thread); return; }
    if (e.target.hasAttribute('data-t-close') && !e.target.closest('.reader-card')) { closeThread(); return; }
    const like = e.target.closest('[data-like]');
    if (like) {
      if (!member) { G.toast('Members appreciate; guests admire. Join us — it’s free.'); return; }
      const key = like.dataset.like;
      const i = likes.indexOf(key);
      i === -1 ? likes.push(key) : likes.splice(i, 1);
      G.store.set('galera_likes', likes);
      like.classList.toggle('on', i === -1);
      like.textContent = i === -1 ? '♥ Appreciated' : '♡ Appreciate';
      return;
    }
    if (e.target.closest('[data-report]')) {
      G.toast('Reported to the moderators. Thank you for carrying the room.');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeThread();
    if (e.key === 'Enter' && e.target.matches('[data-thread]')) openThread(e.target.dataset.thread);
  });

  G.watchReveals();
})();
