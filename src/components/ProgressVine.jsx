import { useState } from 'react';
import { bossReadiness } from '../data/profile.js';

const milestones = [
  { at: 2, label: 'Recall it', icon: '🧠' },
  { at: 4, label: 'Build it', icon: '🧱' },
  { at: 6, label: 'Apply it', icon: '🗺️' },
  { at: 8, label: 'Teach Purple', icon: '🐶' },
  { at: 10, label: 'Boss door', icon: '🚪' }
];

export default function ProgressVine({ profile, onCompleteWorld }) {
  const [bossOpen, setBossOpen] = useState(false);
  const gates = Math.min(10, profile.worldProgress?.waterfall?.gates || 0);
  const completed = Boolean(profile.worldProgress?.waterfall?.bossComplete);
  const readiness = bossReadiness(profile);
  const missing = Object.entries(readiness).filter(([key, value]) => key !== 'gates' && !value).map(([key]) => key);
  const allReady = Object.values(readiness).every(Boolean);

  return (
    <section className="world-progress-card" aria-label="Progress to Crystal Forest">
      <div className="progress-vine-copy">
        <p className="eyebrow">Road to Crystal Forest</p>
        <h2>{completed ? 'The giant door is open!' : `${10 - gates} vine step${10 - gates === 1 ? '' : 's'} to the giant door`}</h2>
        <p>{completed ? 'Waterfall Dash and the Trail Backpack are unlocked. Crystal Forest is ready.' : 'Complete guided expeditions and show the idea in more than one way. Skipped problems return later, but they never trap you.'}</p>
        <div className="progress-reward-row"><span>Next world</span><strong>💎 Crystal Forest</strong><span>Reward</span><strong>💦 Waterfall Dash + 🎒 Backpack</strong></div>
        {gates >= 10 && !completed && <button className="primary-btn" type="button" onClick={() => setBossOpen(true)}>Face the Waterfall Guardian</button>}
        {completed && <a className="primary-btn" href="#worlds">Walk through the giant door</a>}
      </div>

      <div className="vine-tree" aria-hidden="true">
        <div className="tree-trunk" />
        <div className="vine-stem" style={{ '--vine-progress': `${gates * 10}%` }} />
        {milestones.map((item, index) => (
          <div key={item.label} className={`vine-node ${gates >= item.at ? 'reached' : ''}`} style={{ bottom: `${10 + index * 18}%`, left: `${index % 2 ? 58 : 28}%` }}>
            <i>{gates >= item.at ? '✓' : item.icon}</i><span>{item.label}</span>
          </div>
        ))}
        <div className={`giant-world-door ${completed ? 'open' : ''}`}><i /><b /><span>💎</span></div>
        <div className="vine-counter">{gates}/10</div>
      </div>

      {bossOpen && (
        <div className="boss-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setBossOpen(false)}>
          <section className="boss-modal" role="dialog" aria-modal="true" aria-label="Waterfall Guardian challenge">
            <button className="modal-close" onClick={() => setBossOpen(false)}>×</button>
            <div className="guardian-figure"><span>🦍</span><i>💧</i></div>
            <p className="eyebrow">World One Finale</p>
            <h2>The Waterfall Guardian</h2>
            <p>“The door opens for explorers who can remember, build, apply, explain, and return later.”</p>
            <div className="boss-crystals">
              {[
                ['gates', 'Trail complete', '🌿'],
                ['recall', 'Recall', '🧠'],
                ['visual', 'Build a model', '🧱'],
                ['application', 'Apply it', '🗺️'],
                ['explanation', 'Teach Purple', '🐶'],
                ['retention', 'Remember later', '🌙']
              ].map(([key, label, icon]) => <div key={key} className={readiness[key] ? 'lit' : ''}><span>{icon}</span><strong>{label}</strong><small>{readiness[key] ? 'Ready' : 'Keep training'}</small></div>)}
            </div>
            {allReady ? (
              <button className="primary-btn boss-win-button" onClick={() => { onCompleteWorld(); setBossOpen(false); }}>Light every crystal and open the door</button>
            ) : (
              <div className="boss-not-ready"><strong>Almost ready</strong><p>Train these areas: {missing.join(', ')}. The boss stays available and no progress is lost.</p><a className="ghost-btn" href="#practice" onClick={() => setBossOpen(false)}>Return to the guided expedition</a></div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
