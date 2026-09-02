# RIHULA corrected ZIP — fixes applied

## Verified
- All standalone `.js` files pass `node --check`.
- All inline JavaScript blocks in the HTML pages pass `node --check`.
- Local HTML/CSS/JS/image references were checked; no missing project assets were found.
- The only `qkjymwjhtzidbwpeusoh.supabase.co` reference was an outdated announcement push endpoint and has been removed. The active client remains the Supabase project configured in `supabase.js`.

## Authentication fixes
- Member registration now uses Supabase Auth metadata consistently.
- The dual-role SQL now installs the missing `auth.users` -> `members` trigger.
- New Auth users receive a pending member profile automatically.
- Existing members can be linked during account activation without creating duplicate member rows.
- Added the missing `activate_old_member(...)` RPC used by `activate-account.html`.
- Member password changes now verify the current password before changing it.

## Password recovery
- `forgot-password.html` now sends a Supabase Auth recovery email.
- `reset-password.html` now accepts the recovery session and updates the password securely.

## Announcements
- Removed the browser call to the old Supabase Edge Function project.
- Announcements are still saved to the current `notifications` table without failing because of an unrelated legacy push endpoint.

## Service worker
- Cache version bumped to `rihula-v5-2026-08-24` so updated frontend files can replace the older cached release.

## Important Supabase step
Run `RIHULA-AUTH-FIX.sql` in the CURRENT RIHULA Supabase SQL project before testing registration/activation. This is necessary because the missing database trigger/RPC cannot be fixed by frontend code alone.

- Admin activity audit: stopped recording page-open events and ordinary member profile edits; member add/delete and approval/rejection remain audited.
