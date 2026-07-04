# Firebase private-beta setup

## 1. Authentication

In Firebase Console:

1. Open **Authentication**.
2. Open **Sign-in method**.
3. Enable **Email/Password**.
4. In **Settings → Authorized domains**, add:
   `tmsreacher-math-tag.netlify.app`

## 2. Firestore

1. Open **Firestore Database**.
2. Create the database in **Production mode**.
3. Open the **Rules** tab.
4. Copy the full contents of `firestore.rules` into the editor.
5. Publish the rules.

The rules isolate every household by the authenticated parent UID. They also restrict beta-code creation to admin accounts and permit a verified parent to claim an active, unused, unexpired code once.

## 3. Bootstrap the first admin

The app cannot safely make the first user an admin by itself.

1. Create the parent account in the app and verify the email.
2. In Firebase Console, open **Authentication → Users**.
3. Copy the parent account UID.
4. Open **Firestore Database → Data**.
5. Create collection: `admins`
6. Create a document whose document ID is the copied UID.
7. Add field:
   - `active` (Boolean): `true`

After signing out and back in, the account panel will show **Beta codes**. The admin can then generate one-use codes that expire after seven days.

## 4. Create the first beta code

1. Open Jungle Academy.
2. Sign in with the admin parent account.
3. Open **Account → Beta codes**.
4. Tap **Generate code**.
5. Copy the displayed code to a trusted parent.

The code is stored with a normalized document ID, can be claimed only once, and is marked inactive in the same Firestore transaction that creates the new household.

## 5. Netlify feedback notifications

The app stores parent feedback in Firestore and also submits the hidden Netlify form named `beta-feedback`.

To receive private email notifications:

1. In Netlify, open the site.
2. Open **Forms** and confirm `beta-feedback` is detected after the first deployment.
3. Open **Site configuration → Notifications**.
4. Add an **Email notification** for form submissions.
5. Set the destination to the testing inbox.

The destination email is configured in Netlify and is not included in client code or displayed publicly.

## 6. Test sequence before inviting families

1. Register a parent account.
2. Verify the email.
3. Try an invalid code.
4. Activate with a valid code.
5. Confirm the same code cannot be reused.
6. Create six child profiles and confirm the seventh is blocked in the UI.
7. Create one adult player and confirm a second is blocked.
8. Import existing local progress.
9. Play, reload, and confirm cloud progress returns.
10. Switch profiles and confirm progress remains separate.
11. Reset learning while preserving cosmetics.
12. Delete a player profile.
13. Submit feedback and confirm it appears in Firestore and Netlify Forms.
14. Delete a disposable household account.

## 7. Known beta constraint

Firestore Security Rules validate household ownership and document shape, but cannot reliably count all child-profile documents during a client write. The six-child limit is enforced in the app. Before open registration, move profile creation into a trusted Cloud Function or another server endpoint that performs an atomic count check.
