# RIHULA V2.4 Deployment Checklist

- [ ] Confirm the production Supabase URL and publishable key are configured.
- [ ] Confirm no service-role key or SMTP secret is present in frontend files.
- [ ] Run the supplied Supabase/RLS SQL in the intended project after reviewing it.
- [ ] Verify admin authorization and RLS policies using a non-admin member account.
- [ ] Test member activation and login.
- [ ] Test contribution creation and contribution history.
- [ ] Test withdrawal validation against available balance.
- [ ] Run `PROFILE-PHOTO-STORAGE-FIX.sql` in the current Supabase project.
- [ ] Test profile photo upload permissions.
- [ ] Test chat copy/delete permissions.
- [ ] Test mobile navigation and loading/error states.
- [ ] Check browser console for remaining errors before deployment.
