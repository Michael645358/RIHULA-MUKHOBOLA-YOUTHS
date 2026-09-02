# RIHULA ZIP — fixes applied

## Applied
1. Updated the standalone `sendNotification` endpoint from the old Supabase project to the current RIHULA Supabase project used by `supabase.js`.
2. Removed the unnecessary legacy `script.js` from `record-contribution.html`. The page now loads only the current contribution/admin stack, preventing duplicate global admin functions from being loaded on the contribution page.
3. Added an explicit note to `WITHDRAWAL_FINANCE_SECURITY.sql` identifying `RIHULA-FINANCE-FIX.sql` as the canonical combined finance/withdrawal SQL file and warning against unnecessary double execution. No executable finance SQL was changed.

## Intentionally unchanged
- Current Supabase URL/key in `supabase.js`.
- Current OneSignal app configuration.
- Contribution confirmation and save logic in `record-contribution.js`.
- Withdrawal RPC logic in `withdrawal-fix.js`.
- Admin authentication/role logic.
- Existing pages, styling, database table names, and RIHULA UI.
- `admin.html` and `admin-1.html` were retained; no dashboard was removed or redirected.
