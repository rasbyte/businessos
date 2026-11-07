# 0004. Web sign in

Date: 2026-11-07
Status: accepted

## Decision

- The web server talks to the API. Login actions run on the server, so the browser never sees the tokens.
- Tokens live in `httpOnly`, `sameSite=lax` cookies (`secure` in production): `bos_at` (access, expires a minute before the token) and `bos_rt` (refresh, 30 days).
- `proxy.ts` does only a quick cookie check and renews an expired access token with the refresh token. It skips renewal on background prefetches.
- Pages ask the API who the user is (`/api/auth/me`) on every request, so logout or a disabled user takes effect at once.
- If the API rejects an access token, the page sends the visitor to `/signout`, which clears the cookies. This avoids a redirect loop.
- A failed renewal never clears cookies, because it may be the losing side of two simultaneous renewals.

## Consequences

The reverse proxy in front of the web server must overwrite `X-Forwarded-For` with the real client address. The web server forwards it to the API, which trusts it from private networks only. The API address comes from the `API_URL` setting (default `http://localhost:3000`).
