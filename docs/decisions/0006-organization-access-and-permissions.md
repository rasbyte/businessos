# 0006. Organization access and permissions

Date: 2026-11-08
Status: accepted

## Decision

- Every rent route has the form `/api/orgs/:orgId/...` and uses `AuthGuard` then `OrgAccessGuard`.
- `OrgAccessGuard` lets in only active members of an active organization. Anyone else gets 404, so an organization's existence is not revealed. A member without the needed permission gets 403.
- Owners can do everything in their organization. Managers need the permission named on the route with `@RequirePermission(...)`. The permission names live in `@businessos/contracts`.
- A membership can be limited to one business. Services filter every query by organization and, when set, by that business.
- Service code never trusts an organization id sent in a body. The organization always comes from the guard.
- Unit numbers are unique per property. A unit with lease history cannot be deleted.

## Consequences

Every new rent feature adds its permission names to `contracts`, gets `@RequirePermission` on each route, and needs an end-to-end test proving another organization cannot see its data.
