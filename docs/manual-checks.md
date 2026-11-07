# Manual checks before the beta

Things the automated tests cannot cover. Tick each one off before launch.

## Web sign in (browser)

- [ ] Sign in with the developer phone: request the code, enter it, land on the home page.
- [ ] Delete only the `bos_at` cookie and reload: still signed in and the cookie comes back.
- [ ] Sign out, then press back: the home page is not shown.
- [ ] A wrong code shows the red error message in both languages.
- [ ] Asking for a second code within a minute shows the waiting message.
- [ ] The `sessions` table has no sessions left un-revoked after the test.
- [ ] The same flow on a phone-sized screen.
