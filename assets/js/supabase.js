/* ============================================================
   GALERA — Supabase client
   Loaded as a classic script AFTER the supabase-js UMD bundle:
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     <script src="assets/js/supabase.js"></script>
   Exposes window.sb (the client) and window.SB_READY (a promise that
   resolves once the initial auth session has been restored).
   ============================================================ */
(function () {
  'use strict';

  /* --- Public config. Safe to commit: the anon key is a PUBLISHABLE key,
         protected by Row-Level Security. NEVER put the service_role key here.
         Values live in Supabase → Project Settings → API. --- */
  const SUPABASE_URL = window.GALERA_SUPABASE_URL || 'PASTE_YOUR_PROJECT_URL';
  const SUPABASE_ANON_KEY = window.GALERA_SUPABASE_ANON_KEY || 'PASTE_YOUR_ANON_KEY';

  const lib = window.supabase; // the UMD global from the CDN bundle
  if (!lib || !lib.createClient) {
    console.error('[Galera] supabase-js not loaded — add the CDN <script> before supabase.js');
    return;
  }
  if (SUPABASE_URL.startsWith('PASTE_')) {
    console.warn('[Galera] Supabase not configured yet — fill SUPABASE_URL / SUPABASE_ANON_KEY in assets/js/supabase.js');
  }

  window.sb = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  /* resolves once the session is known, so pages can render auth-aware UI */
  window.SB_READY = window.sb.auth.getSession().then(({ data }) => data.session || null);
})();
