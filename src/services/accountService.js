import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { auth, db, firebaseReady } from './firebase.js';

export const CHILD_PROFILE_LIMIT = 6;
const INVITE_DAYS = 7;

function assertFirebase() {
  if (!firebaseReady || !auth || !db) {
    throw new Error('Cloud accounts are not configured yet. The game still works in guest mode.');
  }
}

export function observeAuth(callback) {
  if (!firebaseReady || !auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function createParentAccount(email, password) {
  assertFirebase();
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await sendEmailVerification(credential.user, {
    url: import.meta.env.VITE_APP_BASE_URL || window.location.origin
  });
  return credential.user;
}

export async function signInParent(email, password) {
  assertFirebase();
  return (await signInWithEmailAndPassword(auth, email.trim(), password)).user;
}

export async function signOutParent() {
  assertFirebase();
  return signOut(auth);
}

export async function sendReset(email) {
  assertFirebase();
  return sendPasswordResetEmail(auth, email.trim(), {
    url: import.meta.env.VITE_APP_BASE_URL || window.location.origin
  });
}

export async function refreshVerification(user) {
  if (!user) return null;
  await reload(user);
  return auth.currentUser;
}

export function normalizeInviteCode(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export async function claimInviteAndCreateHousehold(user, inviteCode, householdName = 'Jungle household') {
  assertFirebase();
  if (!user?.emailVerified) throw new Error('Verify the parent email before activating the household.');
  const code = normalizeInviteCode(inviteCode);
  if (code.length < 6) throw new Error('Enter the complete beta invitation code.');

  const householdRef = doc(db, 'households', user.uid);
  const inviteRef = doc(db, 'invites', code);

  await runTransaction(db, async (transaction) => {
    const householdSnap = await transaction.get(householdRef);
    if (householdSnap.exists()) return;

    const inviteSnap = await transaction.get(inviteRef);
    if (!inviteSnap.exists()) throw new Error('That invitation code was not found.');
    const invite = inviteSnap.data();
    const expiresAt = invite.expiresAt?.toDate?.() || new Date(0);
    if (!invite.active || invite.usedBy) throw new Error('That invitation code has already been used or revoked.');
    if (expiresAt.getTime() <= Date.now()) throw new Error('That invitation code has expired.');

    transaction.update(inviteRef, {
      active: false,
      usedBy: user.uid,
      usedAt: serverTimestamp()
    });

    transaction.set(householdRef, {
      ownerUid: user.uid,
      parentEmail: user.email,
      displayName: householdName.trim().slice(0, 60) || 'Jungle household',
      inviteCode: code,
      beta: true,
      registrationVersion: '1.7',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      childProfileLimit: CHILD_PROFILE_LIMIT,
      adultProfileLimit: 1,
      parentConsent: true,
      consentVersion: 'private-beta-2026-07',
      consentedAt: serverTimestamp()
    });
  });

  return getHousehold(user.uid);
}

export async function getHousehold(uid) {
  assertFirebase();
  const snapshot = await getDoc(doc(db, 'households', uid));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function listProfiles(uid) {
  assertFirebase();
  const snapshot = await getDocs(collection(db, 'households', uid, 'profiles'));
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
}

function publicProfileFields(profile) {
  return {
    nickname: String(profile.nickname || 'Explorer').trim().slice(0, 24),
    role: profile.role === 'adult' ? 'adult' : 'child',
    monkeStyle: profile.monkeStyle || 'jungle-monke',
    rank: profile.rank || 'Jungle Scout',
    shinyRocks: Number(profile.gameState?.shinyRocks || profile.shinyRocks || 0),
    streak: Number(profile.gameState?.dailyLoginStreak || profile.streak || 0),
    weeklyScore: Number(profile.weeklyScore || 0)
  };
}

export async function createHouseholdProfile(uid, profile, gameState) {
  assertFirebase();
  const existing = await listProfiles(uid);
  const role = profile.role === 'adult' ? 'adult' : 'child';
  if (role === 'child' && existing.filter((item) => item.role === 'child').length >= CHILD_PROFILE_LIMIT) {
    throw new Error(`This beta allows up to ${CHILD_PROFILE_LIMIT} child profiles.`);
  }
  if (role === 'adult' && existing.some((item) => item.role === 'adult')) {
    throw new Error('This household already has an adult player profile.');
  }

  const profileRef = doc(collection(db, 'households', uid, 'profiles'));
  const publicFields = publicProfileFields({ ...profile, gameState });
  await setDoc(profileRef, {
    ...publicFields,
    gameState,
    settings: gameState?.settings || {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    schemaVersion: 1
  });
  return { id: profileRef.id, ...publicFields, gameState };
}

export async function saveGameState(uid, profileId, gameState) {
  assertFirebase();
  if (!uid || !profileId) return;
  const weeklyScore = calculateWeeklyScore(gameState);
  await setDoc(doc(db, 'households', uid, 'profiles', profileId), {
    ...publicProfileFields({
      nickname: gameState.playerName,
      role: gameState.profileRole,
      monkeStyle: gameState.monkeStyle,
      gameState,
      rank: gameState.rank,
      weeklyScore
    }),
    gameState,
    settings: gameState.settings || {},
    weeklyScore,
    updatedAt: serverTimestamp(),
    schemaVersion: 1
  }, { merge: true });
}

export async function deleteHouseholdProfile(uid, profileId) {
  assertFirebase();
  await deleteDoc(doc(db, 'households', uid, 'profiles', profileId));
}

export async function submitBetaFeedback(uid, feedback) {
  assertFirebase();
  const feedbackRef = doc(collection(db, 'households', uid, 'feedback'));
  const payload = {
    category: String(feedback.category || 'general').slice(0, 40),
    message: String(feedback.message || '').trim().slice(0, 4000),
    expected: String(feedback.expected || '').trim().slice(0, 2000),
    profileId: feedback.profileId || null,
    appVersion: '1.7.0',
    userAgent: navigator.userAgent.slice(0, 500),
    pageUrl: window.location.href.slice(0, 500),
    createdAt: serverTimestamp(),
    status: 'new'
  };
  await setDoc(feedbackRef, payload);

  const body = new URLSearchParams({
    'form-name': 'beta-feedback',
    category: payload.category,
    message: payload.message,
    expected: payload.expected,
    appVersion: payload.appVersion,
    householdUid: uid
  });
  await fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  }).catch(() => null);
  return feedbackRef.id;
}

export async function isAdmin(uid) {
  if (!firebaseReady || !uid) return false;
  const snapshot = await getDoc(doc(db, 'admins', uid));
  return snapshot.exists() && snapshot.data().active === true;
}

function randomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (value, index) => alphabet[value % alphabet.length] + (index === 4 ? '-' : '')).join('');
}

export async function createBetaInvite(adminUid) {
  assertFirebase();
  const displayCode = randomCode();
  const code = normalizeInviteCode(displayCode);
  const expiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);
  await setDoc(doc(db, 'invites', code), {
    displayCode,
    active: true,
    createdBy: adminUid,
    createdAt: serverTimestamp(),
    expiresAt,
    usedBy: null,
    usedAt: null,
    maxUses: 1,
    version: '1.7'
  });
  return { code: displayCode, expiresAt };
}

export async function listBetaInvites() {
  assertFirebase();
  const snapshot = await getDocs(collection(db, 'invites'));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function revokeBetaInvite(code) {
  assertFirebase();
  await updateDoc(doc(db, 'invites', normalizeInviteCode(code)), {
    active: false,
    revokedAt: serverTimestamp()
  });
}

export async function deleteHouseholdAccount(uid, currentUser) {
  assertFirebase();
  const profiles = await getDocs(collection(db, 'households', uid, 'profiles'));
  const feedback = await getDocs(collection(db, 'households', uid, 'feedback'));
  const batch = writeBatch(db);
  profiles.forEach((snapshot) => batch.delete(snapshot.ref));
  feedback.forEach((snapshot) => batch.delete(snapshot.ref));
  batch.delete(doc(db, 'households', uid));
  await batch.commit();
  await deleteUser(currentUser);
}

export function calculateWeeklyScore(gameState) {
  const daily = gameState?.daily || {};
  const now = new Date();
  let total = 0;
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const day = daily[key];
    if (day) total += (day.correct || 0) * 10 + (day.total || 0) * 2;
  }
  return total;
}
