import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import Hero from './components/Hero.jsx';
import PracticeArena from './components/PracticeArena.jsx';
import Flashcards from './components/Flashcards.jsx';
import Dashboard from './components/Dashboard.jsx';
import WorldMap from './components/WorldMap.jsx';
import ProgressVine from './components/ProgressVine.jsx';
import { cosmetics } from './data/maps.js';
import { completeWaterfallWorld, defaultProfile, getRank, mergeProfile } from './data/profile.js';
import { updateLoginStreak } from './math/adaptiveEngine.js';

const AccountHub = lazy(() => import('./components/AccountHub.jsx'));

function loadProfile() {
  try {
    return mergeProfile(JSON.parse(localStorage.getItem('tmsreacher-profile')) || {});
  } catch {
    return mergeProfile(defaultProfile);
  }
}

export default function App() {
  const [profile, setProfile] = useState(() => updateLoginStreak(loadProfile()));
  const [cloudSession, setCloudSession] = useState(null);
  const [cloudStatus, setCloudStatus] = useState('Guest progress is saved on this device.');
  const [shopMessage, setShopMessage] = useState('Choose a category, preview the gear on the correct attachment point, then buy or equip it.');
  const [dailyMessage, setDailyMessage] = useState('Keep your daily streak alive with one practice round.');
  const [actionMessage, setActionMessage] = useState('');

  const rankedProfile = useMemo(() => ({ ...profile, rank: getRank(profile.level) }), [profile]);

  useEffect(() => {
    localStorage.setItem('tmsreacher-profile', JSON.stringify(rankedProfile));
  }, [rankedProfile]);

  useEffect(() => {
    if (!cloudSession?.uid || !cloudSession?.profileId) {
      setCloudStatus('Guest progress is saved on this device.');
      return undefined;
    }
    setCloudStatus('Saving to the household cloud…');
    const timer = window.setTimeout(async () => {
      try {
        const { saveGameState } = await import('./services/accountService.js');
        await saveGameState(cloudSession.uid, cloudSession.profileId, rankedProfile);
        setCloudStatus('Cloud progress saved.');
      } catch (error) {
        console.error(error);
        setCloudStatus('Cloud save paused. Local progress is still safe on this device.');
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [rankedProfile, cloudSession]);

  useEffect(() => {
    const streak = profile.dailyLoginStreak || 1;
    setDailyMessage(`Daily streak: ${streak} day${streak === 1 ? '' : 's'}. Today’s login reward is in the Shiny Rock pile.`);
  }, [profile.dailyLoginStreak]);

  function loadSelectedProfile(nextProfile) {
    setProfile(updateLoginStreak(mergeProfile(nextProfile)));
  }

  function resetGuestProgress() {
    if (cloudSession) {
      setActionMessage('Use Account → Data & privacy to reset a cloud player with confirmation.');
      return;
    }
    setProfile(updateLoginStreak(mergeProfile(defaultProfile)));
    setShopMessage('Fresh guest save started. Monke and Purple are back at the treehouse.');
    setActionMessage('Local guest progress reset.');
  }

  function buyItem(item) {
    const slot = item.slot;
    const isOwned = profile.ownedCosmetics.includes(item.id);
    const equippedCosmetics = { ...profile.equippedCosmetics, [slot]: item.id };

    if (isOwned) {
      setProfile({ ...profile, equippedCosmetics, equippedCosmetic: item.id });
      setShopMessage(`${item.name} equipped on the correct ${slot.replace('monke', 'Monke ').replace('dog', 'Purple ')} slot.`);
      return;
    }

    if (item.unlock === 'waterfall-boss') {
      setShopMessage(`${item.name} is earned by completing the Waterfall Guardian encounter.`);
      return;
    }

    if (profile.shinyRocks < item.cost) {
      setShopMessage(`Need ${item.cost - profile.shinyRocks} more Shiny Rocks for ${item.name}.`);
      return;
    }

    setProfile({
      ...profile,
      shinyRocks: profile.shinyRocks - item.cost,
      ownedCosmetics: [...profile.ownedCosmetics, item.id],
      equippedCosmetics,
      equippedCosmetic: item.id
    });
    setShopMessage(`${item.name} unlocked and equipped. The same avatar renderer is used in the shop and the world.`);
  }

  function useBanana() {
    if (profile.bananas <= 0) {
      const message = 'No bananas yet. Earn them through practice challenges.';
      setShopMessage(message); setActionMessage(message); return;
    }
    if (profile.energy >= 100) {
      const message = 'Energy is already full, so Purple saved the banana for later.';
      setShopMessage(message); setActionMessage(message); return;
    }
    const before = profile.energy;
    const after = Math.min(100, before + 20);
    setProfile({ ...profile, bananas: profile.bananas - 1, energy: after });
    const message = `Banana snack used: energy ${before}% → ${after}%.`;
    setShopMessage(message); setActionMessage(message);
  }

  function finishWaterfallWorld() {
    setProfile((current) => completeWaterfallWorld(current));
    setActionMessage('The giant door opened! Waterfall Dash, the Trail Backpack, 250 Shiny Rocks, and Crystal Forest are unlocked.');
    setShopMessage('Trail Backpack and Waterfall Dash were added to Monke’s equipped gear.');
  }

  return (
    <main className="app-shell">
      <div className="ambient-world" aria-hidden="true">
        <span className="ambient-mist mist-one" /><span className="ambient-mist mist-two" />
        <span className="ambient-fall fall-one" /><span className="ambient-fall fall-two" />
        <span className="ambient-leaf leaf-one" /><span className="ambient-leaf leaf-two" />
      </div>
      <nav className="top-nav">
        <a className="brand-mark" href="#treehouse">TMS REACHER</a>
        <div className="top-nav-actions">
          <div className="nav-stats"><span>🔥 {profile.dailyLoginStreak || 1}</span><span>🪨 {profile.shinyRocks}</span><span>🍌 {profile.bananas}</span><span>⚡ {profile.energy}%</span><span>⭐ L{profile.level}</span></div>
          <Suspense fallback={<button className="account-trigger" type="button" disabled><span>☁️</span><span><strong>Loading account</strong><small>Private beta</small></span></button>}><AccountHub profile={rankedProfile} setProfile={loadSelectedProfile} onCloudSessionChange={setCloudSession} /></Suspense>
        </div>
      </nav>
      <div className={`cloud-save-pill ${cloudSession ? 'cloud-active' : ''}`} aria-live="polite">{cloudStatus}</div>
      <Hero profile={rankedProfile} useBanana={useBanana} dailyMessage={dailyMessage} actionMessage={actionMessage} />
      <ProgressVine profile={rankedProfile} onCompleteWorld={finishWaterfallWorld} />
      <PracticeArena profile={rankedProfile} setProfile={setProfile} />
      <Flashcards profile={rankedProfile} setProfile={setProfile} />
      <WorldMap profile={rankedProfile} cosmetics={cosmetics} buyItem={buyItem} shopMessage={shopMessage} useBanana={useBanana} />
      <Dashboard profile={rankedProfile} />
      <section className="panel footer-panel">
        <p className="eyebrow">v1.7 Private Family Beta</p>
        <h2>Crystal Forest + household account foundation</h2>
        <p>This build adds parent-owned Firebase accounts, invite-only household activation, six child profiles, one adult challenger, cloud saves, beta feedback, secure reset/delete flows, starter Monke designs, a vine progress tree, a giant world door, world rewards, weekly featured gear, and Shardback’s Crystal Forest preview.</p>
        <button className="ghost-btn" onClick={resetGuestProgress}>{cloudSession ? 'Cloud reset lives in Account settings' : 'Reset local guest progress'}</button>
      </section>
    </main>
  );
}
