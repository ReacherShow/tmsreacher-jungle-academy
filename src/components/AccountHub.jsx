import { useEffect, useMemo, useState } from 'react';
import {
  CHILD_PROFILE_LIMIT,
  claimInviteAndCreateHousehold,
  createBetaInvite,
  createHouseholdProfile,
  createParentAccount,
  deleteHouseholdAccount,
  deleteHouseholdProfile,
  getHousehold,
  isAdmin,
  listBetaInvites,
  listProfiles,
  observeAuth,
  refreshVerification,
  revokeBetaInvite,
  sendReset,
  signInParent,
  signOutParent,
  submitBetaFeedback
} from '../services/accountService.js';
import { firebaseReady } from '../services/firebase.js';
import { makeNewProfile, mergeProfile, resetLearningProgress } from '../data/profile.js';
import { starterMonkes } from '../data/maps.js';

function friendlyError(error) {
  const code = error?.code || '';
  if (code.includes('email-already-in-use')) return 'That email already has an account. Try signing in.';
  if (code.includes('invalid-credential')) return 'The email or password did not match.';
  if (code.includes('weak-password')) return 'Use a longer password with at least 8 characters.';
  if (code.includes('too-many-requests')) return 'Too many attempts. Take a short break and try again.';
  if (code.includes('requires-recent-login')) return 'For security, sign out and sign back in before deleting the account.';
  return error?.message || 'Something did not work. Please try again.';
}

export default function AccountHub({ profile, setProfile, onCloudSessionChange }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('account');
  const [user, setUser] = useState(null);
  const [household, setHousehold] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [loading, setLoading] = useState(firebaseReady);
  const [message, setMessage] = useState(firebaseReady ? 'Checking cloud account…' : 'Cloud beta is not configured in this build environment.');
  const [admin, setAdmin] = useState(false);

  useEffect(() => observeAuth(async (nextUser) => {
    setUser(nextUser);
    setLoading(false);
    if (!nextUser) {
      setHousehold(null);
      setProfiles([]);
      setActiveProfileId(null);
      setAdmin(false);
      onCloudSessionChange(null);
      setMessage(firebaseReady ? 'Playing as a guest on this device.' : 'Cloud beta is not configured in this build environment.');
      return;
    }
    setLoading(true);
    try {
      const [nextHousehold, adminStatus] = await Promise.all([
        getHousehold(nextUser.uid),
        isAdmin(nextUser.uid)
      ]);
      setAdmin(adminStatus);
      setHousehold(nextHousehold);
      if (nextHousehold) {
        const nextProfiles = await listProfiles(nextUser.uid);
        setProfiles(nextProfiles);
        const stored = localStorage.getItem(`tmsreacher-active-profile-${nextUser.uid}`);
        const selected = nextProfiles.find((item) => item.id === stored) || nextProfiles[0] || null;
        if (selected) selectCloudProfile(selected, nextUser, false);
        else setMessage('Account ready. Create the first player profile.');
      } else {
        setMessage(nextUser.emailVerified ? 'Enter a beta invitation code to activate this household.' : 'Check the parent email and verify the account.');
      }
    } catch (error) {
      setMessage(friendlyError(error));
    } finally {
      setLoading(false);
    }
  }), []);

  function selectCloudProfile(selected, currentUser = user, closeAfter = true) {
    if (!selected || !currentUser) return;
    const gameState = mergeProfile({
      ...(selected.gameState || {}),
      playerName: selected.nickname,
      profileRole: selected.role,
      monkeStyle: selected.monkeStyle
    });
    setProfile(gameState);
    setActiveProfileId(selected.id);
    localStorage.setItem(`tmsreacher-active-profile-${currentUser.uid}`, selected.id);
    onCloudSessionChange({ uid: currentUser.uid, profileId: selected.id, user: currentUser });
    setMessage(`${selected.nickname} is ready. Progress will sync to the household account.`);
    if (closeAfter) setOpen(false);
  }

  async function refreshAccount() {
    if (!user) return;
    setLoading(true);
    try {
      const nextHousehold = await getHousehold(user.uid);
      const nextProfiles = nextHousehold ? await listProfiles(user.uid) : [];
      setHousehold(nextHousehold);
      setProfiles(nextProfiles);
      return { nextHousehold, nextProfiles };
    } catch (error) {
      setMessage(friendlyError(error));
    } finally {
      setLoading(false);
    }
  }

  const activeCloudProfile = profiles.find((item) => item.id === activeProfileId);
  const label = activeCloudProfile?.nickname || (user ? 'Choose profile' : 'Guest mode');

  return (
    <div className="account-hub">
      <button className="account-trigger" type="button" onClick={() => setOpen(true)}>
        <span>{user ? '☁️' : '🌿'}</span>
        <span><strong>{label}</strong><small>{user ? 'Cloud beta' : 'This device only'}</small></span>
      </button>

      {open && (
        <div className="account-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <section className="account-modal" role="dialog" aria-modal="true" aria-label="Household account">
            <div className="account-modal-head">
              <div><p className="eyebrow">Private Family Beta</p><h2>Jungle Accounts</h2></div>
              <button className="modal-close" onClick={() => setOpen(false)} aria-label="Close account panel">×</button>
            </div>

            <div className="account-nav">
              <button className={view === 'account' ? 'active' : ''} onClick={() => setView('account')}>Account</button>
              {household && <button className={view === 'profiles' ? 'active' : ''} onClick={() => setView('profiles')}>Players</button>}
              {household && <button className={view === 'feedback' ? 'active' : ''} onClick={() => setView('feedback')}>Feedback</button>}
              {admin && <button className={view === 'admin' ? 'active' : ''} onClick={() => setView('admin')}>Beta codes</button>}
              {household && <button className={view === 'privacy' ? 'active' : ''} onClick={() => setView('privacy')}>Data & privacy</button>}
            </div>

            <p className={`account-status ${loading ? 'loading' : ''}`} aria-live="polite">{message}</p>

            {view === 'account' && (
              !firebaseReady ? <CloudNotConfigured />
                : !user ? <AuthForms setMessage={setMessage} setLoading={setLoading} />
                  : !user.emailVerified ? <VerifyEmail user={user} setUser={setUser} setMessage={setMessage} setLoading={setLoading} />
                    : !household ? <ActivateHousehold user={user} onActivated={async (next) => { setHousehold(next); await refreshAccount(); setView('profiles'); }} setMessage={setMessage} setLoading={setLoading} />
                      : <HouseholdSummary user={user} household={household} profiles={profiles} activeProfile={activeCloudProfile} onSignOut={async () => { await signOutParent(); setOpen(false); }} />
            )}

            {view === 'profiles' && household && (
              <ProfileManager
                user={user}
                profiles={profiles}
                activeProfileId={activeProfileId}
                localProfile={profile}
                onSelect={selectCloudProfile}
                onRefresh={refreshAccount}
                setMessage={setMessage}
                setLoading={setLoading}
              />
            )}

            {view === 'feedback' && household && (
              <FeedbackForm user={user} profileId={activeProfileId} setMessage={setMessage} setLoading={setLoading} />
            )}

            {view === 'admin' && admin && (
              <AdminTools user={user} setMessage={setMessage} setLoading={setLoading} />
            )}

            {view === 'privacy' && household && (
              <PrivacyTools
                user={user}
                profile={profile}
                activeProfile={activeCloudProfile}
                onReset={(next) => setProfile(next)}
                onRefresh={refreshAccount}
                onCloudSessionChange={onCloudSessionChange}
                setMessage={setMessage}
                setLoading={setLoading}
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function CloudNotConfigured() {
  return (
    <div className="account-empty">
      <span>☁️</span>
      <h3>Guest mode is still available</h3>
      <p>Add the seven Firebase environment variables to Netlify, then rebuild when deployment credits are available.</p>
    </div>
  );
}

function AuthForms({ setMessage, setLoading }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signup') {
        await createParentAccount(email, password);
        setMessage('Account created. Open the verification email before activating the household.');
      } else {
        await signInParent(email, password);
        setMessage('Signed in. Loading the household…');
      }
    } catch (error) {
      setMessage(friendlyError(error));
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    if (!email.trim()) {
      setMessage('Enter the parent email first.');
      return;
    }
    setLoading(true);
    try {
      await sendReset(email);
      setMessage('Password reset email sent.');
    } catch (error) {
      setMessage(friendlyError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-grid">
      <form className="account-form" onSubmit={submit}>
        <h3>{mode === 'signup' ? 'Create parent account' : 'Parent sign in'}</h3>
        <label>Parent email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>Password<input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        <button className="primary-btn" type="submit">{mode === 'signup' ? 'Create account' : 'Sign in'}</button>
        <button className="text-btn" type="button" onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
          {mode === 'signup' ? 'Already have an account?' : 'Have a beta code? Create an account'}
        </button>
        {mode === 'signin' && <button className="text-btn" type="button" onClick={resetPassword}>Forgot password</button>}
      </form>
      <div className="privacy-card">
        <strong>Parent-owned beta</strong>
        <p>Children do not need an email, password, birthday, school, location, or public profile.</p>
        <ul><li>Up to six child profiles</li><li>One adult challenge profile</li><li>Private by default</li></ul>
      </div>
    </div>
  );
}

function VerifyEmail({ user, setUser, setMessage, setLoading }) {
  async function checkAgain() {
    setLoading(true);
    try {
      const refreshed = await refreshVerification(user);
      setUser(refreshed);
      setMessage(refreshed?.emailVerified ? 'Email verified. Enter the beta invitation code.' : 'Not verified yet. Open the email, tap the link, then check again.');
    } catch (error) {
      setMessage(friendlyError(error));
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="verification-card">
      <span>📬</span><h3>Verify the parent email</h3>
      <p>A verification link was sent to <strong>{user.email}</strong>. Verification protects household setup and account recovery.</p>
      <div className="button-row"><button className="primary-btn" onClick={checkAgain}>I verified it</button><button className="ghost-btn" onClick={() => signOutParent()}>Use another email</button></div>
    </div>
  );
}

function ActivateHousehold({ user, onActivated, setMessage, setLoading }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const household = await claimInviteAndCreateHousehold(user, code, name || 'Jungle household');
      setMessage('Household activated. Create the first player profile.');
      await onActivated(household);
    } catch (error) {
      setMessage(friendlyError(error));
    } finally {
      setLoading(false);
    }
  }
  return (
    <form className="account-form narrow" onSubmit={submit}>
      <h3>Activate trusted-family access</h3>
      <label>Household name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Coleman household" maxLength="60" /></label>
      <label>One-use invitation code<input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="ABCDE-23456" required /></label>
      <label className="check-row consent-check"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required /> I am the adult parent or guardian, I am joining an invite-only beta, and I consent to storing the parent email, player nicknames, learning progress, game inventory, settings, and parent-submitted feedback for beta operation.</label>
      <button className="primary-btn" type="submit" disabled={!consent}>Activate household</button>
      <small>Codes expire after seven days or after their first use, whichever happens first.</small>
    </form>
  );
}

function HouseholdSummary({ user, household, profiles, activeProfile, onSignOut }) {
  return (
    <div className="household-summary">
      <div className="summary-card"><small>Household</small><strong>{household.displayName}</strong><span>{user.email}</span></div>
      <div className="summary-card"><small>Players</small><strong>{profiles.filter((item) => item.role === 'child').length}/{CHILD_PROFILE_LIMIT} children</strong><span>{profiles.some((item) => item.role === 'adult') ? 'Adult player ready' : 'Adult profile available'}</span></div>
      <div className="summary-card"><small>Active player</small><strong>{activeProfile?.nickname || 'Choose a player'}</strong><span>{activeProfile ? `${activeProfile.rank || 'Jungle Scout'} · ${activeProfile.shinyRocks || 0} rocks` : 'Open Players to continue'}</span></div>
      <button className="ghost-btn" onClick={onSignOut}>Sign out parent account</button>
    </div>
  );
}

function ProfileManager({ user, profiles, activeProfileId, localProfile, onSelect, onRefresh, setMessage, setLoading }) {
  const [creating, setCreating] = useState(false);
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState('child');
  const [monkeStyle, setMonkeStyle] = useState('jungle-monke');
  const [importLocal, setImportLocal] = useState(true);
  const childCount = profiles.filter((item) => item.role === 'child').length;
  const hasAdult = profiles.some((item) => item.role === 'adult');
  const canCreate = role === 'child' ? childCount < CHILD_PROFILE_LIMIT : !hasAdult;

  async function create(event) {
    event.preventDefault();
    if (!canCreate) return;
    setLoading(true);
    try {
      const gameState = importLocal
        ? mergeProfile({ ...localProfile, playerName: nickname, profileRole: role, monkeStyle })
        : makeNewProfile({ nickname, role, monkeStyle });
      const created = await createHouseholdProfile(user.uid, { nickname, role, monkeStyle }, gameState);
      const refreshed = await onRefresh();
      const complete = refreshed?.nextProfiles?.find((item) => item.id === created.id) || created;
      onSelect(complete);
      setMessage(`${nickname} created and selected.`);
      setCreating(false);
      setNickname('');
    } catch (error) {
      setMessage(friendlyError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="profile-manager">
      <div className="profile-grid">
        {profiles.map((item) => (
          <button key={item.id} className={`profile-card ${activeProfileId === item.id ? 'active' : ''}`} onClick={() => onSelect(item)}>
            <MonkeSwatch styleId={item.monkeStyle} />
            <strong>{item.nickname}</strong>
            <span>{item.role === 'adult' ? 'Adult challenger' : item.rank || 'Jungle Scout'}</span>
            <small>🪨 {item.shinyRocks || 0} · 🔥 {item.streak || 0} · Weekly {item.weeklyScore || 0}</small>
          </button>
        ))}
        <button className="profile-card add-profile" onClick={() => setCreating(!creating)}><span>＋</span><strong>Add player</strong><small>{childCount}/{CHILD_PROFILE_LIMIT} child profiles</small></button>
      </div>

      {creating && (
        <form className="profile-create-form" onSubmit={create}>
          <div className="panel-head"><h3>Create player profile</h3><button className="text-btn" type="button" onClick={() => setCreating(false)}>Cancel</button></div>
          <label>Nickname<input value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength="24" required placeholder="Explorer name" /></label>
          <div className="role-picker">
            <button type="button" className={role === 'child' ? 'active' : ''} onClick={() => setRole('child')}>Child player</button>
            <button type="button" className={role === 'adult' ? 'active' : ''} onClick={() => setRole('adult')}>Adult challenger</button>
          </div>
          {!canCreate && <p className="form-warning">{role === 'child' ? 'This household already has six child profiles.' : 'Only one adult player profile is available in this beta.'}</p>}
          <div className="starter-monke-grid">
            {starterMonkes.map((item) => (
              <button key={item.id} type="button" className={monkeStyle === item.id ? 'active' : ''} onClick={() => setMonkeStyle(item.id)}>
                <MonkeSwatch styleId={item.id} /><strong>{item.name}</strong><small>{item.description}</small>
              </button>
            ))}
          </div>
          <label className="check-row"><input type="checkbox" checked={importLocal} onChange={(event) => setImportLocal(event.target.checked)} /> Import the progress currently saved on this device</label>
          <button className="primary-btn" disabled={!canCreate}>Create player</button>
        </form>
      )}
    </div>
  );
}

function MonkeSwatch({ styleId }) {
  const style = starterMonkes.find((item) => item.id === styleId) || starterMonkes[0];
  return <span className="monke-swatch" style={{ '--fur': style.fur, '--face': style.face, '--accent': style.accent }}><i /><b /></span>;
}

function FeedbackForm({ user, profileId, setMessage, setLoading }) {
  const [category, setCategory] = useState('learning');
  const [messageText, setMessageText] = useState('');
  const [expected, setExpected] = useState('');
  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await submitBetaFeedback(user.uid, { category, message: messageText, expected, profileId });
      setMessage('Feedback saved in the beta inbox. Netlify can also email a private notification once form notifications are enabled.');
      setMessageText(''); setExpected('');
    } catch (error) {
      setMessage(friendlyError(error));
    } finally {
      setLoading(false);
    }
  }
  return (
    <form className="account-form feedback-form" onSubmit={submit}>
      <h3>Send beta feedback</h3>
      <p>Please do not include a child’s full name, school, address, location, or other identifying information.</p>
      <label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="learning">Learning</option><option value="design">Design</option><option value="difficulty">Difficulty</option><option value="bug">Bug</option><option value="account">Account</option></select></label>
      <label>What happened?<textarea value={messageText} onChange={(event) => setMessageText(event.target.value)} required rows="5" maxLength="4000" /></label>
      <label>What did you expect?<textarea value={expected} onChange={(event) => setExpected(event.target.value)} rows="3" maxLength="2000" /></label>
      <button className="primary-btn">Send feedback</button>
    </form>
  );
}

function AdminTools({ user, setMessage, setLoading }) {
  const [invites, setInvites] = useState([]);
  const [latest, setLatest] = useState(null);
  async function load() {
    setLoading(true);
    try { setInvites(await listBetaInvites()); } catch (error) { setMessage(friendlyError(error)); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  async function create() {
    setLoading(true);
    try { const invite = await createBetaInvite(user.uid); setLatest(invite); setMessage('One-use code created. It expires in seven days.'); await load(); } catch (error) { setMessage(friendlyError(error)); } finally { setLoading(false); }
  }
  async function revoke(code) {
    setLoading(true);
    try { await revokeBetaInvite(code); setMessage('Invitation revoked.'); await load(); } catch (error) { setMessage(friendlyError(error)); } finally { setLoading(false); }
  }
  return (
    <div className="admin-tools">
      <div className="panel-head"><div><h3>Trusted-family codes</h3><p>Each code works once and expires after seven days.</p></div><button className="primary-btn" onClick={create}>Generate code</button></div>
      {latest && <div className="invite-code-callout"><small>New beta code</small><strong>{latest.code}</strong><span>Expires {latest.expiresAt.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>}
      <div className="invite-list">{invites.map((item) => <article key={item.id}><div><strong>{item.displayCode || item.id}</strong><span>{item.usedBy ? 'Used' : item.active ? 'Active' : 'Revoked'} · expires {item.expiresAt?.toDate?.().toLocaleDateString() || 'unknown'}</span></div>{item.active && !item.usedBy && <button className="mini-btn" onClick={() => revoke(item.id)}>Revoke</button>}</article>)}</div>
    </div>
  );
}

function PrivacyTools({ user, profile, activeProfile, onReset, onRefresh, onCloudSessionChange, setMessage, setLoading }) {
  const [confirmText, setConfirmText] = useState('');
  const [accountText, setAccountText] = useState('');

  async function resetLearning() {
    if (confirmText !== 'RESET' || !activeProfile) return;
    const next = resetLearningProgress(profile);
    onReset(next);
    setConfirmText('');
    setMessage('Learning progress reset. Cosmetics, inventory, and player appearance were kept. Cloud sync will save the reset.');
  }

  async function deleteProfile() {
    if (confirmText !== 'DELETE' || !activeProfile) return;
    setLoading(true);
    try {
      await deleteHouseholdProfile(user.uid, activeProfile.id);
      onCloudSessionChange(null);
      await onRefresh();
      setConfirmText('');
      setMessage('Player profile deleted.');
    } catch (error) { setMessage(friendlyError(error)); } finally { setLoading(false); }
  }

  async function deleteAccount() {
    if (accountText !== 'DELETE HOUSEHOLD') return;
    setLoading(true);
    try {
      await deleteHouseholdAccount(user.uid, user);
      localStorage.removeItem(`tmsreacher-active-profile-${user.uid}`);
      onCloudSessionChange(null);
      setMessage('Household account deleted.');
    } catch (error) { setMessage(friendlyError(error)); } finally { setLoading(false); }
  }

  return (
    <div className="privacy-tools">
      <div className="privacy-card"><h3>Data kept for this beta</h3><p>Parent email, household ID, player nickname, chosen Monke, learning progress, review schedule, streak, inventory, world progress, settings, and parent-submitted feedback.</p><p>Not requested: child email, full legal name, exact birthday, school, address, contacts, photos, or precise location.</p></div>
      {activeProfile && <div className="danger-card"><h3>Reset or delete {activeProfile.nickname}</h3><p>Type <strong>RESET</strong> to clear learning progress while keeping cosmetics. Type <strong>DELETE</strong> to remove the whole player profile.</p><input value={confirmText} onChange={(event) => setConfirmText(event.target.value.toUpperCase())} /><div className="button-row"><button className="ghost-btn" onClick={resetLearning} disabled={confirmText !== 'RESET'}>Reset learning</button><button className="danger-btn" onClick={deleteProfile} disabled={confirmText !== 'DELETE'}>Delete player</button></div></div>}
      <div className="danger-card"><h3>Delete household account</h3><p>This removes the household and all profiles. Type <strong>DELETE HOUSEHOLD</strong>.</p><input value={accountText} onChange={(event) => setAccountText(event.target.value.toUpperCase())} /><button className="danger-btn" onClick={deleteAccount} disabled={accountText !== 'DELETE HOUSEHOLD'}>Delete household account</button></div>
    </div>
  );
}
