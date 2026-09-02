# RIHULA Profile Photo Upload Fix

The profile page uploads photos to the Supabase Storage bucket
`profile-pictures`.

The frontend already used the correct member folder format, but the project
package did not include the Storage bucket/RLS policies required for an
authenticated member to insert files.

## Apply the fix

1. Open the CURRENT RIHULA project in Supabase.
2. Open **SQL Editor**.
3. Run `PROFILE-PHOTO-STORAGE-FIX.sql`.
4. Reload the website after clearing the old cached service worker if needed.
5. Log in and try **Upload Profile Photo** again.

The SQL creates the bucket as public for profile-image URLs while restricting
uploads, updates and deletes to the logged-in member's own folder.

The frontend was also changed to log the actual Storage error in the browser
console instead of hiding it behind a generic message.
