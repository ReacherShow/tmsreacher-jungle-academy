import { useMemo, useState } from 'react';
import { maps } from '../data/maps.js';
import PurpleDog from './PurpleDog.jsx';

const categories = [
  { id: 'dogNeck', label: 'Purple', icon: '🐾' },
  { id: 'monkeHead', label: 'Monke head', icon: '👑' },
  { id: 'monkeBack', label: 'Monke gear', icon: '🎒' }
];

export default function WorldMap({ profile, cosmetics, buyItem, shopMessage, useBanana }) {
  const bananaDisabled = profile.bananas <= 0 || profile.energy >= 100;
  const [category, setCategory] = useState('dogNeck');
  const items = useMemo(() => cosmetics.filter((item) => item.slot === category), [cosmetics, category]);
  const [selectedId, setSelectedId] = useState(() => cosmetics.find((item) => item.slot === 'dogNeck')?.id);
  const selected = cosmetics.find((item) => item.id === selectedId) || items[0];

  function selectCategory(nextCategory) {
    setCategory(nextCategory);
    const first = cosmetics.find((item) => item.slot === nextCategory);
    if (first) setSelectedId(first.id);
  }

  const selectedOwned = selected ? profile.ownedCosmetics.includes(selected.id) : false;
  const selectedEquipped = selected
    ? profile.equippedCosmetics?.[selected.slot] === selected.id || profile.equippedCosmetic === selected.id
    : false;

  return (
    <section className="world-grid">
      <div className="panel" id="worlds">
        <p className="eyebrow">Map Gate</p>
        <h2>Themed Worlds</h2>
        <div className="map-list">
          {maps.map((map) => {
            const unlocked = profile.level >= map.level;
            return (
              <article className={`map-card map-${map.theme} ${unlocked ? 'unlocked' : 'locked'}`} key={map.name}>
                <div className="map-emoji">{map.emoji}</div>
                <div><strong>{map.name}</strong><span>{map.skill}</span></div>
                <small>{unlocked ? 'Unlocked' : map.status}</small>
              </article>
            );
          })}
        </div>
      </div>

      <div className="panel avatar-shop" id="shop">
        <div className="panel-head shop-heading">
          <div><p className="eyebrow">Shop Hut</p><h2>Avatar Gear</h2></div>
          <span className="rock-balance">🪨 {profile.shinyRocks}</span>
        </div>
        <p className="shop-message" aria-live="polite">{shopMessage}</p>

        <div className="shop-category-tabs" aria-label="Cosmetic categories">
          {categories.map((item) => (
            <button key={item.id} className={category === item.id ? 'active' : ''} onClick={() => selectCategory(item.id)}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </div>

        <div className="avatar-shop-layout">
          <div className="shop-item-grid" aria-label="Available cosmetics">
            {items.map((item) => {
              const owned = profile.ownedCosmetics.includes(item.id);
              const equipped = profile.equippedCosmetics?.[item.slot] === item.id || profile.equippedCosmetic === item.id;
              return (
                <button
                  key={item.id}
                  className={`shop-item-tile ${selected?.id === item.id ? 'selected' : ''} ${equipped ? 'equipped' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="tile-art">
                    {item.type === 'bandana'
                      ? <div className={`bandana-preview bandana-${item.bandanaStyle}`}><i /><b /></div>
                      : <span>{item.emoji}</span>}
                  </div>
                  <strong>{item.name}</strong>
                  <small>{equipped ? 'Equipped' : owned ? 'Owned' : `${item.cost} 🪨`}</small>
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="shop-detail-card">
              <div className="shop-preview-stage">
                {selected.slot === 'dogNeck'
                  ? <PurpleDog equippedBandana={selected.id} trick="wave" preview />
                  : <div className="monke-shop-preview"><span>🦍</span><b>{selected.emoji}</b></div>}
              </div>
              <div className="shop-detail-copy">
                <small>{selected.tier || 'Monke gear'}</small>
                <h3>{selected.name}</h3>
                <p>{selected.description}</p>
                <div className="shop-status-row">
                  <span>{selectedEquipped ? 'Currently equipped' : selectedOwned ? 'Ready to equip' : `Costs ${selected.cost} Shiny Rocks`}</span>
                </div>
                <button className="shop-equip-button" onClick={() => buyItem(selected)} disabled={selectedEquipped}>
                  {selectedEquipped ? 'Equipped ✓' : selectedOwned ? 'Equip item' : `Buy and equip · ${selected.cost} 🪨`}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="boss-card">
          <span>👹</span>
          <div><strong>First Boss</strong><p>Giant purple monkey with red eyes. Correct answers lower its power.</p></div>
        </div>
        <button className="ghost-btn full-width" onClick={useBanana} disabled={bananaDisabled}>
          {profile.energy >= 100 ? 'Energy is already full' : profile.bananas <= 0 ? 'No bananas available' : 'Use 1 banana for +20 energy'}
        </button>
      </div>
    </section>
  );
}
