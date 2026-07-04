# TMS REACHER: Jungle Academy v1.7

An invite-only family beta of an adaptive math adventure for third- and fourth-grade learners.

## What is new

### Crystal Forest progression
- A vine climbs a tree as guided expeditions are completed.
- Ten vine gates lead to the Waterfall Guardian.
- The giant door opens when the learner has evidence across recall, visual models, application, explanation, and later review.
- World One rewards: Waterfall Dash, the Trail Backpack, 250 Shiny Rocks, and access to Crystal Forest.
- Shardback, the Crystal Boss, appears as the World Two guardian preview.

### Avatar identity
- Four complete starter Monke designs.
- One shared avatar renderer for the world and the store.
- Named head, back, trail, and Purple accessory attachment slots.
- Multiple compatible items may be equipped at once.
- Weekly featured cosmetics rotate without removing the permanent catalog.

### Private household accounts
- Parent email/password registration and verification.
- One-use beta invitation codes that expire after seven days.
- Up to six child profiles plus one adult challenger profile.
- Profile switching with no child email or child password.
- Existing local progress can be imported into a new profile.
- Debounced cloud saving to Cloud Firestore.
- Parent feedback stored in Firestore and submitted to Netlify Forms.
- Confirmed learning reset, player deletion, and household deletion flows.
- Admin-only beta code tools backed by Firestore rules.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

The verified Netlify settings are:

```text
Base directory: leave blank
Build command: npm run build
Publish directory: dist
```

## Firebase environment variables

Copy `.env.example` to `.env.local` for local development. In Netlify, add the same values as build environment variables:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_APP_BASE_URL
```

Do not place service-account files, Admin SDK private keys, email-service API keys, or database passwords in any `VITE_` variable.

## Before enabling accounts

1. Enable Email/Password in Firebase Authentication.
2. Create Cloud Firestore in Production mode.
3. Add the Netlify hostname to Authentication → Settings → Authorized domains.
4. Publish `firestore.rules` from the Firebase console or Firebase CLI.
5. Create the first admin document manually, as described in `docs/FIREBASE-BETA-SETUP.md`.
6. Generate one-use beta codes from the in-app admin panel.
7. Configure a Netlify Forms email notification for the `beta-feedback` form if email alerts are desired.

## Important beta limitation

The UI enforces six child profiles and one adult profile. Strong server-side enforcement of household profile counts should be added with a trusted backend function before open registration. The current beta remains invite-only and intended for a few trusted families.
