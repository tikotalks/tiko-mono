# Tiko Identity API Worker

Cloudflare Worker wrapper around `@tiko/identity`.

## Endpoints

- `POST /api/identity/device` — register or re-identify a device and auto-create a user/session when needed.
- `GET /api/identity/session` — validate bearer session.
- `POST /api/identity/session` — refresh bearer session or create one for a known user/device pair.
- `DELETE /api/identity/session` — revoke bearer session.
- `POST /api/identity/email` — enqueue optional recovery/transfer magic link for the current user.
- `GET /api/identity/verify-magic-link?token=...` — consume magic link and return a new session.

This worker is device-first and Cloudflare-native: sessions are created from device registration, optional email transfer uses magic links, and D1 is canonical storage.

## Local migration

```bash
pnpm --filter @tiko/identity-api-worker db:apply:local
```
