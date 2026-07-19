/* GALERA — contact form (client-side validation; delivery wired at deploy) */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const emailOk = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
  const mark = (el, ok) => { el.closest('.field').classList.toggle('invalid', !ok); return ok; };
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const ok = [
      mark($('#ctName'), $('#ctName').value.trim().length >= 2),
      mark($('#ctEmail'), emailOk($('#ctEmail').value)),
      mark($('#ctMsg'), $('#ctMsg').value.trim().length >= 5)
    ].every(Boolean);
    if (!ok) { Galera.toast('A field or two needs your attention.'); return; }
    this.reset();
    Galera.toast('Received — a person will write back within a day. (Demo)');
  });
  ['ctName', 'ctEmail', 'ctMsg'].forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('input', () => el.closest('.field').classList.remove('invalid'));
  });
})();
