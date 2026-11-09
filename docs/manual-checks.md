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

## Units screens (browser)

- [ ] The units page shows the list in Bangla and in English, and the four filter tabs show the right counts.
- [ ] Add a flat and a shop: the right fields appear for each type, and both show up in the list.
- [ ] Adding a unit with an existing number shows the red duplicate message and keeps what was typed.
- [ ] The bottom menu highlights the current page, and everything is readable on a phone-sized screen.
