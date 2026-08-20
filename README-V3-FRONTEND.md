# RIHULA V3 Front-end Upgrade — SPCK Only

This upgrade is intentionally limited to the files you edit/host in SPCK.

## What was added
- Premium RIHULA V3 visual layer while preserving the existing CSS/HTML structure.
- Responsive mobile bottom navigation on the member dashboard.
- Dark/light appearance toggle with local persistence.
- Quick tools panel for savings history, goals, achievements and updates.
- Member dashboard spotlight section.
- Admin control-centre polish and improved cards/tools.
- Scroll reveal animations with reduced-motion support.
- PWA install prompt and improved service-worker/offline experience.
- Offline fallback page.
- PWA icons generated from the existing RIHULA logo when available.
- Global toast/UI helpers.

## Deliberately NOT changed
- Supabase tables, RPCs, RLS, SQL or database structure.
- Authentication logic.
- Finance calculation logic.
- Existing contribution/withdrawal rules.
- Existing core JavaScript functions.

## Files to notice
- `rihula-v3-ui.css` — new visual layer.
- `rihula-v3-ui.js` — new UI-only behaviour.
- `offline.html` — PWA offline fallback.
- `sw.js` — improved local caching/update handling.

The original `style.css`, `rihula-modern-design.css`, page structure and existing application scripts remain in place.
