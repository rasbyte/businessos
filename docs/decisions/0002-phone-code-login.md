# 0002. Phone code login

Date: 2026-11-06
Status: accepted

## Context

Users include elderly owners and renters. They need a login with no password to remember.

## Decision

- Login by phone number and a 6 digit code sent by SMS.
- Phone numbers are stored in international format and cleaned by `normalizePhone` in `@businessos/contracts`.
- Codes live in Redis for 5 minutes, only as a keyed hash (HMAC with `OTP_SECRET`), with at most 5 attempts.
- One code request per phone per minute, 5 per phone per hour and 20 per IP address per hour.
- `POST /api/auth/request-code` always answers the same way, so it cannot be used to find out who is registered. Only active users receive a code.
- SMS goes through the `SmsSender` interface. Development prints to the server log. Production refuses to start until a real provider is added.

## Consequences

A real Bangladesh SMS provider must be chosen and implemented before the beta launch. Behind a reverse proxy, trust proxy settings are needed so the IP limit sees real client addresses.
