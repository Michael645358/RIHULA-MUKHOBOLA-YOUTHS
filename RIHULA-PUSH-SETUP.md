# RIHULA Automatic Push Notifications

This addition keeps the existing RIHULA/Supabase contribution logic intact.

## What happens

1. Admin records the contribution using the existing **Save Contribution** button.
2. The existing `contributions` insert runs exactly as before.
3. Only after that insert succeeds, `admin.js` invokes `send-rihula-push`.
4. The Edge Function verifies the signed-in user is an RIHULA admin.
5. It finds the member using the existing `members.phone` field.
6. It uses the existing `members.auth_id` as the OneSignal External ID.
7. OneSignal sends the push to that member's subscribed devices.

If push delivery fails, the contribution is **not rolled back** and the existing contribution workflow remains successful.

## Required one-time setup

In Supabase Dashboard -> Edge Functions -> Secrets, add:

- `ONESIGNAL_APP_ID` = your existing OneSignal App ID
- `ONESIGNAL_REST_API_KEY` = the OneSignal App API/REST key

Do NOT put `ONESIGNAL_REST_API_KEY` in HTML or browser JavaScript.

Supabase automatically provides the function with `SUPABASE_URL` and its server-side secret key environment. The Edge Function accepts either the current `SUPABASE_SECRET_KEYS` environment or the legacy `SUPABASE_SERVICE_ROLE_KEY` environment.

## Deploy

Deploy the folder:

`supabase/functions/send-rihula-push`

The function should keep JWT verification enabled (the default). It expects the logged-in Supabase user's Authorization token.

## OneSignal requirements

Members must have:

- visited RIHULA over HTTPS,
- granted browser notification permission,
- completed the RIHULA OneSignal subscription,
- been identified with their RIHULA `members.auth_id` External ID.

The current RIHULA frontend already contains the OneSignal Web SDK foundation. OneSignal recommends calling `login(external_id)` after the user is identified.

## Important

No new Supabase table or column is required by this implementation.

The existing contribution insert remains the source of truth. Push is a separate best-effort notification after a successful insert.
