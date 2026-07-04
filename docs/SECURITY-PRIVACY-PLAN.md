# TMS REACHER Security and Child Privacy Plan

This document is an engineering checklist, not legal advice. Obtain review from a qualified privacy attorney before a public child-directed launch.

## Account model

- The parent or guardian owns the account and authenticates with an adult email address.
- Children use parent-created profiles with a nickname and avatar. Child profiles do not require email, phone number, date of birth, or a password.
- Friends are connected only after parent approval through short-lived invitation codes.
- Approved friends may see only nickname/avatar, Shiny Rocks, rank, streak, and weekly score.
- No public user search, free-form chat, direct messages, photos, precise location, school, full name, or contact details.

## Minimum data collection

Store only what the product needs:

- Parent email and authentication identifier.
- Household and child profile identifiers.
- Nickname/avatar selection.
- Learning progress, mastery, streaks, rewards, purchases, and settings.
- Parent-managed friend approvals.

Do not add advertising identifiers, behavioral advertising, third-party tracking, contact-list access, or location collection.

## Voice

- Tap-to-hear narration is opt-in and does not require microphone access.
- TMS REACHER voice clips should be parent-provided, reviewed, and bundled as app assets where possible.
- Do not store child microphone recordings by default.
- If voice recording is added later, require parent consent, explain retention, and provide deletion controls.

## Firebase security baseline

- Use Firebase Authentication for parent accounts.
- Use Cloud Firestore Security Rules that scope every household document to the authenticated parent UID.
- Never deploy Firestore with test-mode or allow-all rules.
- Validate allowed fields, data types, maximum lengths, and numeric ranges in rules.
- Use Firebase App Check and enable enforcement after monitoring legitimate traffic.
- Keep admin credentials and service-account keys out of the web app and GitHub.
- Use server-side Cloud Functions/Admin SDK for invite acceptance, bonus awards, deletion, and other privileged operations.
- Log security events without logging child names, answers, or other unnecessary personal data.

## Parent rights and controls

Provide inside the app:

- Export household data.
- Correct profile information.
- Delete a child profile.
- Delete the parent account and associated data.
- Revoke friend connections.
- Withdraw optional permissions and voice features.
- A clear retention schedule and automatic deletion of expired invites and unnecessary logs.

## App Store preparation

- Put outbound YouTube links, purchases, account management, and permissions behind a parental gate.
- Complete App Store privacy disclosures for every data type collected by the app and its SDKs.
- Provide a child-friendly privacy summary and a full parent privacy policy.
- Avoid third-party advertising and tracking SDKs.
- If account creation is enabled, allow account deletion to be initiated inside the app.
- Give App Review a working demo parent account and instructions for any gated features.

## Release gates

Do not invite outside families until:

1. Production Firestore rules pass emulator tests.
2. Parent consent and privacy notices are implemented.
3. Export and deletion flows are tested end-to-end.
4. Friend invitations are parent-to-parent and expire automatically.
5. No child profile can expose data publicly.
6. Dependency and secret scanning run in CI.
7. A privacy attorney reviews the intended launch regions and consent method.
