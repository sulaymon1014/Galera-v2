/* ============================================================
   GALERA — Supabase client
   Loaded as a classic script AFTER the supabase-js UMD bundle:
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     <script src="assets/js/supabase.js"></script>
   Exposes window.sb (the client).
   ============================================================ */
(function () {
  'use strict';

  /* Public config. The anon key is a PUBLISHABLE key protected by
     Row-Level Security — safe to ship in the browser. Never the service_role key. */
  const SUPABASE_URL = 'https://rccuddbyxccahhjjaxxh.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjY3VkZGJ5eGNjYWhoampheHhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMDQ0NzQsImV4cCI6MjA5OTg4MDQ3NH0.nZN2uQSKnumhpoBfw9kPrvs9rUOaZLCtb_NmeDnS1HI';

  const lib = window.supabase; // UMD global from the CDN bundle
  if (!lib || !lib.createClient) {
    console.error('[Galera] supabase-js not loaded — add the CDN <script> before supabase.js');
    return;
  }

  window.sb = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
})();
