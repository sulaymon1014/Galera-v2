/* GALERA — auth (demo membership, stored locally only) */
(function () {
  'use strict';
  const G = window.Galera;
  const $ = (s) => document.querySelector(s);

  if (G.Auth.member) { location.replace('account.html'); return; }

  const tabLogin = $('#tabLogin'), tabRegister = $('#tabRegister');
  const loginForm = $('#loginForm'), registerForm = $('#registerForm');

  function setMode(mode) {
    const reg = mode === 'register';
    tabLogin.classList.toggle('active', !reg);
    tabRegister.classList.toggle('active', reg);
    tabLogin.setAttribute('aria-selected', String(!reg));
    tabRegister.setAttribute('aria-selected', String(reg));
    loginForm.hidden = reg;
    registerForm.hidden = !reg;
    document.title = (reg ? 'Become a member' : 'Sign in') + ' — Galera';
    history.replaceState(null, '', reg ? '?mode=register' : location.pathname);
  }
  tabLogin.addEventListener('click', () => setMode('login'));
  tabRegister.addEventListener('click', () => setMode('register'));
  setMode(new URLSearchParams(location.search).get('mode') === 'register' ? 'register' : 'login');

  /* ---------- validation helpers ---------- */
  const emailOk = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
  function mark(input, ok) {
    input.closest('.field').classList.toggle('invalid', !ok);
    return ok;
  }
  ['liEmail', 'rgEmail'].forEach(id => {
    const el = $('#' + id);
    el.addEventListener('input', () => mark(el, el.value === '' || emailOk(el.value)));
  });

  /* password strength */
  const rgPass = $('#rgPass'), strength = $('#strength'), hint = $('#strengthHint');
  rgPass.addEventListener('input', () => {
    const v = rgPass.value;
    let s = 0;
    if (v.length >= 8) s++;
    if (v.length >= 12 && /[A-Z]/.test(v) && /[0-9]/.test(v)) s++;
    if (v.length >= 14 && /[^A-Za-z0-9]/.test(v)) s++;
    strength.className = 'strength' + (s ? ' s' + s : (v ? ' s1' : ''));
    hint.textContent = !v ? 'Use 8+ characters. A phrase beats a puzzle.'
      : s >= 3 ? 'Excellent — a vault.' : s === 2 ? 'Good — solid enough.' : v.length >= 8 ? 'Acceptable — longer is stronger.' : 'Too short yet.';
    mark(rgPass, v === '' || v.length >= 8);
  });

  function welcome(member) {
    G.Auth.signIn(member);
    G.toast(`Welcome, ${member.name.split(' ')[0]} — the door is open.`);
    const back = new URLSearchParams(location.search).get('back');
    setTimeout(() => location.href = back || 'community.html', 900);
  }

  /* ---------- sign in ---------- */
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#liEmail'), pass = $('#liPass');
    const ok = [mark(email, emailOk(email.value)), mark(pass, pass.value.length > 0)].every(Boolean);
    if (!ok) { G.toast('A field or two needs your attention.'); return; }
    const known = G.store.get('galera_profile', null);
    const name = (known && known.email === email.value.trim() && known.name) ||
      email.value.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    welcome({ name, email: email.value.trim(), mfa: known ? !!known.mfa : false, since: (known && known.since) || new Date().getFullYear() });
  });

  /* ---------- register ---------- */
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#rgName'), email = $('#rgEmail'), terms = $('#rgTerms');
    const ok = [
      mark(name, name.value.trim().length >= 2),
      mark(email, emailOk(email.value)),
      mark(rgPass, rgPass.value.length >= 8)
    ].every(Boolean);
    if (!terms.checked) { G.toast('Please agree to the Terms and Privacy Policy first.'); return; }
    if (!ok) { G.toast('A field or two needs your attention.'); return; }
    const member = {
      name: name.value.trim(),
      email: email.value.trim(),
      mfa: $('#rgMfa').checked,
      since: new Date().getFullYear()
    };
    G.store.set('galera_profile', member);   /* password intentionally not stored */
    welcome(member);
  });

  /* ---------- demo-only paths ---------- */
  document.querySelectorAll('[data-social]').forEach(b =>
    b.addEventListener('click', () => G.toast(`${b.dataset.social} sign-in is illustrative in this demo — use email instead.`)));
  $('#passkeyBtn').addEventListener('click', () =>
    G.toast('Passkeys (WebAuthn) would appear here in production — use email in this demo.'));
  $('#forgot').addEventListener('click', (e) => {
    e.preventDefault();
    const email = $('#liEmail').value;
    G.toast(emailOk(email) ? `Reset link sent to ${email}. (Demo — nothing was sent.)` : 'Enter your email above first, then try again.');
  });
})();
