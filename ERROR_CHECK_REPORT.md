# RIHULA Error Check and Fix Report

## Fixed
- New member registration: conflicting auth.users triggers were the main cause of
  "Database error saving new user".
- Registration SQL now removes the old `on_auth_user_created` trigger and installs
  only `on_auth_user_created_rihula`.
- The old trigger could reference a non-existent `full_name` column.
- Pending Members navigation is present in the admin dashboard.
- Pending Members page has Approve and Reject actions.
- `script.js` had a broken `loadPendingContributions()` block that wrote to an
  undefined `body`; this was corrected.
- `admin.html` had a duplicated Administration Tools opening section; this was corrected.

## Important Supabase step
Run `RIHULA-REGISTRATION-DATABASE-ERROR-FIX.sql` once in the SQL Editor of the
Supabase project configured in `supabase.js`, then test registration with a new email.
