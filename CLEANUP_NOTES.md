# RIHULA V2.3 Cleaned Build

## Changes in this build
- Fixed the password-reset page so it waits for and verifies the Supabase recovery session before allowing a password change.
- Added recovery-session handling for Supabase `PASSWORD_RECOVERY` events.
- Added clearer expired/invalid reset-link handling.
- Redirects to login only after a successful password update.
- Removed the legacy duplicate admin dashboard `admin-1.html`.
- Removed unused legacy `admin-dashboard.css`; the active dashboard uses `admin-dashboard-3.css`.
- Removed the nested old RIHULA fix ZIP from the project.
- Preserved the existing website design, Supabase project configuration, and database structure.

## Important
The current admin login still uses a client-side PIN. This is not secure for production because users can inspect browser code. Production admin access should be moved to Supabase Auth + RLS with an admin role.

## Supabase password-reset settings
In Supabase Authentication URL Configuration, add the exact deployed URL for:
`reset-password.html`

For local testing, use the URL appropriate to your local server, for example:
`http://localhost:5500/reset-password.html`

Do not test the reset flow by opening the HTML file directly with `file://`; use a local web server or your deployed site.
