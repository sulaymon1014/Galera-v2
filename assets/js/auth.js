/* GALERA — auth (real Supabase email/password + OAuth) */
(function () {
  'use strict';
  const G = window.Galera, sb = G.sb;
  const $ = (s) => document.querySelector(s);

  /* already signed in? bounce to the account once the session resolves */
  G.Auth.ready.then((u) => { if (u) location.replace('account.html'); });

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

  /* ---------- validation ---------- */
  const emailOk = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
  const mark = (input, ok) => { input.closest('.field').classList.toggle('invalid', !ok); return ok; };
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

  function goAfterAuth() {
    const back = new URLSearchParams(location.search).get('back');
    location.href = back || 'account.html';
  }

  /* ---------- sign in ---------- */
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#liEmail'), pass = $('#liPass');
    const ok = [mark(email, emailOk(email.value)), mark(pass, pass.value.length > 0)].every(Boolean);
    if (!ok) { G.toast('A field or two needs your attention.'); return; }
    const btn = loginForm.querySelector('button[type=submit]'); btn.disabled = true;
    const { error } = await sb.auth.signInWithPassword({ email: email.value.trim(), password: pass.value });
    btn.disabled = false;
    if (error) { G.toast(error.message || 'Could not sign you in.'); return; }
    G.toast('Welcome back — the door is open.');
    setTimeout(goAfterAuth, 700);
  });

  /* ---------- register ---------- */
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#rgName'), email = $('#rgEmail'), terms = $('#rgTerms');
    const ok = [
      mark(name, name.value.trim().length >= 2),
      mark(email, emailOk(email.value)),
      mark(rgPass, rgPass.value.length >= 8)
    ].every(Boolean);
    if (!terms.checked) { G.toast('Please agree to the Terms and Privacy Policy first.'); return; }
    if (!ok) { G.toast('A field or two needs your attention.'); return; }
    const nm = name.value.trim();
    const btn = registerForm.querySelector('button[type=submit]'); btn.disabled = true;
    const { data, error } = await sb.auth.signUp({
      email: email.value.trim(),
      password: rgPass.value,
      options: { data: { name: nm, full_name: nm } }
    });
    btn.disabled = false;
    if (error) { G.toast(error.message || 'Could not create your account.'); return; }
    if (!data.session) {            /* email confirmation is ON */
      G.toast('Account created — check your email to confirm, then sign in.');
      setMode('login');
      return;
    }
    G.toast(`Welcome, ${nm.split(' ')[0]} — the door is open.`);
    setTimeout(goAfterAuth, 700);
  });

  /* ---------- OAuth (works once the provider is enabled in Supabase) ---------- */
  document.querySelectorAll('[data-social]').forEach(b =>
    b.addEventListener('click', async () => {
      const provider = b.dataset.social.toLowerCase();
      const { error } = await sb.auth.signInWithOAuth({
        provider, options: { redirectTo: new URL('account.html', location.href).href }
      });
      if (error) G.toast(`${b.dataset.social} sign-in isn’t enabled yet — use email for now.`);
    }));

  $('#forgot').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = $('#liEmail').value.trim();
    if (!emailOk(email)) { G.toast('Enter your email above first, then try again.'); return; }
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: new URL('account.html', location.href).href });
    G.toast(error ? (error.message || 'Could not send the reset email.') : `Password reset link sent to ${email}.`);
  });
})();
