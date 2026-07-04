import { useState } from 'react';
import ParentGateLink from './ParentGateLink.jsx';
import PurpleDog from './PurpleDog.jsx';

const dogTricks = ['walk', 'jump', 'spin', 'wave'];

export default function Hero({ profile, useBanana, dailyMessage, actionMessage }) {
  const [trickIndex, setTrickIndex] = useState(0);
  const trick = dogTricks[trickIndex];
  const crown = profile.equippedCosmetics?.monkeHead === 'crown';
  const crystalPack = profile.equippedCosmetics?.monkeBack === 'crystal-pack';
  const equippedBandana = profile.equippedCosmetics?.dogNeck || (profile.equippedCosmetic?.startsWith('dog-bandana') ? profile.equippedCosmetic : null);
  const bananaDisabled = profile.bananas <= 0 || profile.energy >= 100;

  function nextTrick() {
    setTrickIndex((current) => (current + 1) % dogTricks.length);
  }

  return (
    <section className="hero-card level-theme theme-waterfall" id="treehouse">
      <ParentGateLink className="youtube-pill" href="https://youtube.com/@tmsreacher">
        <span className="play">▶</span> TMS REACHER
      </ParentGateLink>
      <div className="hero-grid">
        <div>
          <p className="eyebrow">Home Base · Waterfall Treehouse</p>
          <h1>TMS REACHER: Jungle Academy</h1>
          <p className="lede">Choose a destination in the living jungle, train for 10–15 minutes, and help Monke and Purple grow stronger together.</p>
          <div className="streak-card">🔥 {dailyMessage}</div>
          <div className="button-row">
            <a className="primary-btn" href="#practice">Enter Practice Arena</a>
            <a className="ghost-btn" href="#flashcards">Visit Flash Card Grove</a>
            <button className="ghost-btn" type="button" onClick={nextTrick}>Purple: {trick === 'walk' ? 'do a trick' : trick}</button>
            <button className="ghost-btn" type="button" onClick={useBanana} disabled={bananaDisabled}>
              {profile.energy >= 100 ? 'Energy is full' : profile.bananas <= 0 ? 'No bananas' : 'Use banana snack'}
            </button>
          </div>
          <p className={`action-message ${actionMessage ? 'visible' : ''}`} aria-live="polite">{actionMessage || ' '}</p>
        </div>
        <div className="monke-stage waterfall-stage" aria-label="Waterfall Treehouse world menu">
          <div className="sky-glow" />
          <div className="distant-cliffs cliff-one" />
          <div className="distant-cliffs cliff-two" />
          <div className="main-waterfall"><i /><b /></div>
          <div className="water-pool" />
          <div className="giant-tree"><i /></div>
          <div className="treehouse-structure">
            <span className="treehouse-roof" />
            <span className="treehouse-wall"><i /></span>
            <span className="treehouse-deck" />
            <span className="treehouse-ladder" />
          </div>
          <div className={`monke-character ${crystalPack ? 'wearing-pack' : ''}`}>
            {crown && <span className="monke-crown">👑</span>}
            <span className="monke-emoji">🦍</span>
            {crystalPack && <span className="monke-pack">💎</span>}
          </div>
          <PurpleDog equippedBandana={equippedBandana} trick={trick} />

          <a className="world-sign sign-practice" href="#practice">Practice Arena</a>
          <a className="world-sign sign-flashcards" href="#flashcards">Flash Card Grove</a>
          <a className="world-sign sign-worlds" href="#worlds">Map Gate</a>
          <a className="world-sign sign-shop" href="#shop">Shop Hut</a>
          <a className="world-sign sign-journal" href="#dashboard">Jungle Journal</a>
          <div className="floating-rocks">🪨 {profile.shinyRocks}</div>
        </div>
      </div>
    </section>
  );
}
