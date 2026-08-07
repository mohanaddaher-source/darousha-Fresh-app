# Darousha Fresh

A vegetable delivery storefront: shop, boxes, cart, checkout, delivery
tracking, a commercial/B2B waitlist, and a password-protected Backstage
panel for managing prices, availability, and orders.

## Run it locally

```bash
npm install
npm run dev
```

Then open the local URL it prints (usually http://localhost:5173).

## Deploy it for real (recommended: Vercel)

1. Push this folder to a GitHub repo (or use Vercel's drag-and-drop upload —
   no git required).
2. Go to https://vercel.com → New Project → import the repo (or drag the
   folder in).
3. Vercel auto-detects Vite. Leave the defaults and click Deploy.
4. You'll get a real URL like `darousha-fresh.vercel.app` — you can later
   attach your own domain (e.g. `daroushafresh.com`) from Vercel's Domains
   settings.

Netlify works the same way if you'd rather use that instead.

## After you deploy: two things to update in the code

1. **`SITE_URL`** (near the top of `src/App.jsx`) — change the placeholder
   to your real deployed URL. This makes the tracking links sent over
   WhatsApp/email actually clickable.
2. **CallMeBot WhatsApp alerts** — worth re-testing once hosted for real
   (outside this chat's preview sandbox, background requests may behave
   differently — this is the main thing we were trying to isolate).

## Data storage

Orders, prices, and commercial leads are stored in Firebase Firestore
(project `darousha-fresh`), so everything is shared across every device —
customers ordering from their own phones, you checking Backstage from
yours. Note: it's a one-time fetch on page load, not a live subscription —
if Backstage is already open when a new order comes in, refresh the page
to see it.

The Firestore security rules are currently wide open (`allow read, write:
if true`) to keep setup simple. That's fine for getting started, but worth
tightening once you're running this for real — ask if you want help with
that later.

## Admin / Backstage

- Footer → "Backstage"
- Password: `daroucha2026` (change this in `src/App.jsx`, search for
  `ADMIN_PASSWORD`, before you go live)

## Notification setup

- **WhatsApp (business number)**: already wired to CallMeBot — see the
  comment near `CALLMEBOT_APIKEY` in `src/App.jsx`.
- **Email (optional/backup)**: see the comment near `EMAILJS_SERVICE_ID` —
  currently inactive until you add your EmailJS keys.

## Customer accounts (sign up / sign in)

Customers can create an account (email + password, via Firebase
Authentication) to save their name/phone/address once and see their order
history under the "Account" tab. Setup needed in Firebase:

- Firebase Console -> search for "Authentication" -> Get started ->
  enable the Email/Password provider.

Profile data is stored in Firestore under `profiles/{uid}`. Existing
Firestore rules (`allow read, write: if true`) already cover this
collection since they're a wildcard -- no rule changes needed to get this
working, though see the security note above about tightening rules later.

## Important fix: orders/leads storage structure changed

Orders and commercial leads used to be stored as one shared array inside a
single Firestore document. That had a serious bug: saving or updating
anything rewrote the *entire* list using whatever was loaded into that
particular browser at the time -- so two people using the app around the
same time could silently overwrite each other's orders.

This is now fixed: every order and lead is its own separate Firestore
document (collections `orders` and `leads`, one doc per item, doc id =
that order/lead's id). Saving or updating one can no longer affect any
other.

**Note:** any orders that were saved under the old structure (in
`app-state/dsf-orders`) will not automatically appear under the new
`orders` collection -- they were test data at the time of this fix, but
flagging it in case that's not the case for you by the time you read this.
