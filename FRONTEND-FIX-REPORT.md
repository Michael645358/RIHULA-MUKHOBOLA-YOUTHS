# RIHULA Frontend Fix Report — 26 August 2026

## Scope
This repair is frontend/asset/PWA focused. Supabase configuration, SQL, database tables, RPC definitions, RLS and authentication backend files were not changed.

## Fixed
- Corrected the malformed `<!DOCTYPE html>` in `index.html`.
- Normalized every `.jpg` asset so files named `.jpg` are actually JPEG files. This fixes strict server/MIME handling that can show the logo or slides as broken images.
- Verified all local HTML `src`/`href` asset references resolve to files in the package.
- Added the missing PWA icons required by `manifest.json`: `images/icon-192.png` and `images/icon-512.png`, generated from the RIHULA logo.
- Improved the public header responsiveness so the logo remains horizontal and navigation is usable on SPCK/mobile-width previews instead of becoming an oversized stacked layout.
- Bumped local script query versions from `20260826-0610` to `20260826-0835` to prevent stale JavaScript from an older build being reused by the browser.
- Bumped the service-worker cache from `rihula-v5-2026-08-24` to `rihula-v6-2026-08-26` and added the PWA icons to the core cache. Old cache versions are removed during activation.
- Verified all JavaScript files pass `node --check`.
- Verified the main logo, slides and PWA icons return successful HTTP responses with correct image MIME types in a local server test.

## Supabase safety check
`supabase.js` was compared before and after the repair and is unchanged.
No `.sql` files, Supabase URL/key settings, RPC definitions, RLS policies or database code were edited by this repair.

## Finance/RPC note
The current frontend source uses `get_member_finance` with `p_phone` and already contains a personal-row fallback in the member finance path. The reported `p_member_id` error is not present in the current frontend JS/HTML. Cache-busting and service-worker versioning were therefore included so an older cached frontend cannot continue showing that obsolete call.
