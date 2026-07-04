import { useEffect, useState } from 'react';
import Hero from './components/Hero.jsx';
import PracticeArena from './components/PracticeArena.jsx';
import Flashcards from './components/Flashcards.jsx';
import Dashboard from './components/Dashboard.jsx';
import WorldMap from './components/WorldMap.jsx';
import { cosmetics } from './data/maps.js';
import { defaultSkill, updateLoginStreak } from './math/adaptiveEngine.js';

const subjects = ['addition', 'subtraction', 'multiplication', 'fractions', 'decimals'];

const defaultProfile = {
  playerName: 'Reacher',
  monkeStyle: 'purple-408',
  level: 1,
  xp: 0,
  shinyRocks: 120,
  bananas: 3,
  energy: 85,
  answerStreak: 0,
  dailyLoginStreak: 0,
  bestLoginStreak: 0,
  lastLoginDate: null,
  correct: 0,
  total: 0,
  weakFacts: [],
  ownedCosmetics: [],
  equippedCosmetic: null,
  equippedCosmetics: {
    monkeHead: null,
    monkeBack: null,
    dogNeck: null
  },
  strategyPreferences: {},
  daily: {},
  activityLog: [],
  settings: {
    readQuestions: false,
    readHints: false,
    monkeEncouragement: false
  },
  skills: Object.fromEntries(subjects.map((subject) => [subject, defaultSkill()]))
};

function legacySlot(itemId) {
  return cosmetics.find((item) => item.id === itemId)?.slot || null;
}

function mergeProfile(saved) {
  const merged = { ...defaultProfile, ...(saved || {}) };
  merged.settings = { ...defaultProfile.settings, ...(saved?.settings || {}) };
  merged.equippedCosmetics = { ...defaultProfile.equippedCosmetics, ...(saved?.equippedCosmetics || {}) };
  merged.strategyPreferences = { ...defaultProfile.strategyPreferences, ...(saved?.strategyPreferences || {}) };

  // Migrate older saves that had only one equipped item.
  if (saved?.equippedCosmetic) {
    const slot = legacySlot(saved.equippedCosmetic);
    if (slot && !merged.equippedCosmetics[slot]) merged.equippedCosmetics[slot] = saved.equippedCosmetic;
  }

  merged.skills = { ...defaultProfile.skills, ...(saved?.skills || {}) };
  subjects.forEach((subject) => {
    merged.skills[subject] = { ...defaultSkill(), ...(merged.skills[subject] || {}) };
  });
  return merged;
}

function loadProfile() {
  try {
    return mergeProfile(JSON.parse(localStorage.getItem('tmsreacher-profile')) || {});
  } catch {
    return defaultProfile;
  }
}

export default function App() {
  const [profile, setProfile] = useState(() => updateLoginStreak(loadProfile()));
  const [shopMessage, setShopMessage] = useState('Spend Shiny Rocks on cosmetics. Bandanas have distinct styles and price tiers.');
  const [dailyMessage, setDailyMessage] = useState('Keep your daily streak alive with one practice round.');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    localStorage.setItem('tmsreacher-profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    const streak = profile.dailyLoginStreak || 1;
    setDailyMessage(`Daily streak: ${streak} day${streak === 1 ? '' : 's'}. Today’s login reward is in the Shiny Rock pile.`);
  }, []);

  function resetProgress() {
    setProfile(updateLoginStreak(defaultProfile));
    setShopMessage('Fresh save started. Monke and Purple are back at the treehouse.');
    setActionMessage('Local progress reset.');
  }

  function buyItem(item) {
    const slot = item.slot;
    const isOwned = profile.ownedCosmetics.includes(item.id);
    const equippedCosmetics = { ...profile.equippedCosmetics, [slot]: item.id };

    if (isOwned) {
      setProfile({ ...profile, equippedCosmetics, equippedCosmetic: item.id });
      setShopMessage(`${item.name} equipped. Purple’s outfit updated immediately.`);
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
    setShopMessage(`${item.name} unlocked and equipped. The change is live in the treehouse.`);
  }

  function useBanana() {
    if (profile.bananas <= 0) {
      const message = 'No bananas yet. Earn them through practice challenges.';
      setShopMessage(message);
      setActionMessage(message);
      return;
    }
    if (profile.energy >= 100) {
      const message = 'Energy is already full, so Purple saved the banana for later.';
      setShopMessage(message);
      setActionMessage(message);
      return;
    }
    const before = profile.energy;
    const after = Math.min(100, before + 20);
    setProfile({ ...profile, bananas: profile.bananas - 1, energy: after });
    const message = `Banana snack used: energy ${before}% → ${after}%.`;
    setShopMessage(message);
    setActionMessage(message);
  }

  return (
    <main className="app-shell">
      <div className="ambient-world" aria-hidden="true">
        <span className="ambient-mist mist-one" />
        <span className="ambient-mist mist-two" />
        <span className="ambient-fall fall-one" />
        <span className="ambient-fall fall-two" />
        <span className="ambient-leaf leaf-one" />
        <span className="ambient-leaf leaf-two" />
      </div>
      <nav className="top-nav">
        <a className="brand-mark" href="#treehouse">TMS REACHER</a>
        <div className="nav-stats"><span>🔥 {profile.dailyLoginStreak || 1}</span><span>🪨 {profile.shinyRocks}</span><span>🍌 {profile.bananas}</span><span>⚡ {profile.energy}%</span><span>⭐ L{profile.level}</span></div>
      </nav>
      <Hero profile={profile} useBanana={useBanana} dailyMessage={dailyMessage} actionMessage={actionMessage} />
      <PracticeArena profile={profile} setProfile={setProfile} />
      <Flashcards profile={profile} setProfile={setProfile} />
      <WorldMap profile={profile} cosmetics={cosmetics} buyItem={buyItem} shopMessage={shopMessage} useBanana={useBanana} />
      <Dashboard profile={profile} />
      <section className="panel footer-panel">
        <h2>Season 1 Learning Loop</h2>
        <p>This build adds visible feedback, guided retries, strategy choice, metacognitive reflection, spaced review scheduling, smaller Purple, and tiered bandanas.</p>
        <button className="ghost-btn" onClick={resetProgress}>Reset local progress</button>
      </section>
    </main>
  );
}
