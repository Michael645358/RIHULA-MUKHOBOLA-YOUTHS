RIHULA REGISTRATION FIX

The error "Database error saving new user" was caused by conflicting
auth.users -> public.members triggers.

Run ONLY:
RIHULA-REGISTRATION-DATABASE-ERROR-FIX.sql

in the Supabase SQL Editor for the SAME project configured in supabase.js.

The fixed SQL removes the old trigger named:
on_auth_user_created

and installs one correct trigger:
on_auth_user_created_rihula

After SQL succeeds:
1. Refresh the RIHULA website.
2. Register a NEW member with a new email.
3. The member should be created with status: pending.
4. Open Pending Members as admin to Approve or Reject the member.

Do not use the service_role key in frontend code.
