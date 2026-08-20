# RIHULA Security / Finance Improvement

## What was corrected
- Removed the hard-coded admin PIN (`2580`) from the browser code.
- Admin login now uses Supabase Authentication (admin email + password).
- Admin access is checked against the authenticated member record and role.
- Direct navigation to admin operational pages is guarded.
- Admin logout signs out from Supabase Auth and clears local admin flags.
- Withdrawal processing is centralized through `withdrawal-fix.js`.
- Kenyan phone numbers are normalized before member/withdrawal lookup.
- Withdrawals cannot exceed the member's net savings.
- Withdrawal amount is capped at KSh 10,000,000 in the client and SQL.
- Withdrawal records include `created_by` when supported.
- Added `SECURITY_HARDENING.sql` for Supabase RLS and admin-role enforcement.

## Admin setup
1. In Supabase Authentication, create the administrator account.
2. Ensure that account has a matching row in `members` with `auth_id` equal to
   the Supabase Auth user ID.
3. Set `members.role` to `admin`, `administrator`, `chairperson`, `secretary`,
   or `treasurer`.
4. Run `SECURITY_HARDENING.sql` in Supabase SQL Editor.
5. Test member login, admin login, contribution recording, member editing,
   and withdrawal before production use.

## Important
The frontend can hide pages, but real security comes from Supabase Auth + RLS.
Do not put a service-role key or database password in any HTML/JS file.
