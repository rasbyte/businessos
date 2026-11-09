# 0007. Beta scope

Date: 2026-11-08
Status: accepted

## Decision

- The beta is for one internal organization (the owner's own building) and covers: units, renters and leases, the signed paper agreement photo, rent and electricity charges with meter readings, payment requests with owner approval, dues and history, receipts shared as WhatsApp links, a dashboard, and the renter portal.
- Agreements: the owner uploads a photo of the signed paper agreement and marks the lease as signed. In-app digital signing (code to sign) comes after the beta, because the legal value of electronic signatures in Bangladesh has not been checked and the paper original stays the legal document.
- Selling the system to other businesses (plans, subscriptions, customer organizations and their payment approval) comes after the beta. Nothing in rent depends on it.
- SMS and email sending, automatic reminders, expenses and detailed reports come after the beta. WhatsApp starts as a ready message link the owner sends himself.
- Every build step delivers the API together with its screen, with automated checks (`pnpm check`) and a signed-in smoke test (`pnpm smoke`).

## Consequences

The lease statuses for digital signing already exist in the database, so adding it later needs no migration.
