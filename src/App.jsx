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
  daily: {},
  activityLog: [],
  skills: Object.fromEntries(subjects.map((s) => [s, defaultSkill()]))
};

function mergeProfile(saved) {
  const merged = { ...defaultProfile, ...(saved || {}) };
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
  const [shopMessage, setShopMessage] = useState('Spend Shiny Rocks on cosmetics. Bananas restore energy.');
  const [dailyMessage, setDailyMessage] = useState('Keep your daily streak alive with one practice round.');

  useEffect(() => {
    localStorage.setItem('tmsreacher-profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    const streak = profile.dailyLoginStreak || 1;
    setDailyMessage(`Daily streak: ${streak} day${streak === 1 ? '' : 's'}. Login reward added: Shiny Rocks!`);
  }, []);

  function resetProgress() {
    setProfile(updateLoginStreak(defaultProfile));
    setShopMessage('Fresh save started. Monke is back at the treehouse.');
  }

  function buyItem(item) {
    if (profile.ownedCosmetics.includes(item.id)) {
      setProfile({ ...profile, equippedCosmetic: item.id });
      setShopMessage(`${item.name} equipped.`);
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
      equippedCosmetic: item.id
    });
    setShopMessage(`${item.name} unlocked and equipped!`);
  }

  function useBanana() {
    if (profile.bananas <= 0) {
      setShopMessage('No bananas yet. Earn bananas by answering correctly in practice.');
      return;
    }
    setProfile({ ...profile, bananas: profile.bananas - 1, energy: Math.min(100, profile.energy + 20) });
    setShopMessage('Banana snack used. +20 energy.');
  }

  return (
    <main className="app-shell">
      <nav className="top-nav">
        <a className="brand-mark" href="https://youtube.com/@tmsreacher" target="_blank" rel="noreferrer" aria-label="Open TMS REACHER on YouTube">▶ TMS REACHER</a>
        <div className="nav-stats"><span>🔥 {profile.dailyLoginStreak || 1}</span><span>🪨 {profile.shinyRocks}</span><span>🍌 {profile.bananas}</span><span>⚡ {profile.energy}%</span><span>⭐ L{profile.level}</span></div>
      </nav>
      <Hero profile={profile} useBanana={useBanana} dailyMessage={dailyMessage} />
      <PracticeArena profile={profile} setProfile={setProfile} />
      <Flashcards profile={profile} setProfile={setProfile} />
      <WorldMap profile={profile} cosmetics={cosmetics} buyItem={buyItem} shopMessage={shopMessage} useBanana={useBanana} />
      <Dashboard profile={profile} />
      <section className="panel footer-panel">
        <h2>Next Builds</h2>
        <p>Cloud accounts, family profiles, real YouTube video feed, animated boss battles, and longer weekly missions.</p>
        <button className="ghost-btn" onClick={resetProgress}>Reset local progress</button>
      </section>
    </main>
  );
}
