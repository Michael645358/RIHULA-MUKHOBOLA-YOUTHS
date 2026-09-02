RIHULA SUPABASE INITIALIZATION FIX

Problem fixed:
- The browser preview was failing at supabase.js with:
  Cannot read properties of undefined (reading 'createClient')
- That left window.db undefined, which caused the later rank, finance,
  savings, contribution and last-seen errors.

Changes:
1. Supabase JS is pinned to v2.45.4 instead of an unpinned @2 URL.
2. HTML pages have a CDN fallback to unpkg if jsDelivr fails.
3. supabase.js has a second fallback and validates window.supabase before
   calling createClient().
4. window.db and window.supabaseClient are initialized consistently.
5. OneSignal errors are isolated so an unsupported browser does not break
   the RIHULA dashboard.
6. Added rihula-db-guard.js for a clear database-unavailable console message.

No Supabase tables, member records, contribution records, authentication
credentials, or SQL data were changed.
