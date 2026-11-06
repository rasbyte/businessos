# 0003. Sessions and tokens

Date: 2026-11-06
Status: accepted

## Decision

- After a correct code, the API returns a 15 minute access token (JWT, HS256, signed with `JWT_SECRET`) and a 30 day refresh token.
- The access token holds only the user id and the session id. Protected routes also check the session row, so logout and disabling a user take effect immediately.
- The refresh token is random. Only its SHA-256 hash is stored in `sessions`.
- Each refresh revokes the old session and creates a new one. Using an already used refresh token revokes every session of that user.
- Every failed login answers with the same message.

## Consequences

Each protected request costs one small database lookup. Rotating `JWT_SECRET` signs everyone out of their current access token.
