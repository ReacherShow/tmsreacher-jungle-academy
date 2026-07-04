import { useMemo, useState } from 'react';
import { featuredCosmeticsForWeek, maps } from '../data/maps.js';
import PurpleDog from './PurpleDog.jsx';
import MonkeAvatar from './MonkeAvatar.jsx';

const categories = [
  { id: 'dogNeck', label: 'Purple', icon: '🐾' },
  { id: 'monkeHead', label: 'Head', icon: '👑' },
  { id: 'monkeBack', label: 'Back', icon: '🎒' },
  { id: 'monkeTrail', label: 'Trails', icon: '💦' }
];

export default function WorldMap({ profile, cosmetics, buyItem, shopMessage, useBanana }) {
  const bananaDisabled = profile.bananas <= 0 || profile.energy >= 100;
  const [category, setCategory] = useState('dogNeck');
  const featuredIds = useMemo(() => featuredCosmeticsForWeek(), []);
  const items = useMemo(() => cosmetics.filter((item) => item.slot === category), [cosmetics, category]);
  const [selectedId, setSelectedId] = useState(() => cosmetics.find((item) => item.slot === 'dogNeck')?.id);
  const selected = cosmetics.find((item) => item.id === selectedId) || items[0];

  function selectCategory(nextCategory) {
    setCategory(nextCategory);
    const first = cosmetics.find((item) => item.slot === nextCategory);
    if (first) setSelectedId(first.id);
  }

  const selectedOwned = selected ? profile.ownedCosmetics.includes(selected.id) : false;
  const selectedEquipped = selected ? profile.equippedCosmetics?.[selected.slot] === selected.id : false;
  const previewEquipment = selected ? { ...profile.equippedCosmetics, [selected.slot]: selected.id } : profile.equippedCosmetics;
  const crystalUnlocked = Boolean(profile.worldProgress?.crystalForest?.unlocked);

  return (
    <section className="world-grid">
      <div className="panel" id="worlds">
        <p className="eyebrow">Giant World Door</p>
        <h2>World Trail</h2>
        <div className="map-list">
          {maps.map((map) => {
            const unlocked = map.id === 'treehouse' || (map.id === 'crystal-forest' && crystalUnlocked);
            return (
              <article className={`map-card map-${map.theme} ${unlocked ? 'unlocked' : 'locked'}`} key={map.name}>
                <div className="map-emoji">{map.emoji}</div>
                <div><strong>{map.name}</strong><span>{map.skill}</span></div>
                <small>{unlocked ? (map.id === 'treehouse' ? 'Current world' : 'Unlocked') : map.status}</small>
              </article>
            );
          })}
        </div>

        <div className={`crystal-forest-preview ${crystalUnlocked ? 'unlocked' : ''}`}>
          <div className="crystal-trees"><i /><i /><i /><b /><b /></div>
          <div className="shardback-preview"><span>🦍</span><i>💎</i><b>💎</b></div>
          <div className="crystal-preview-copy">
            <small>World 2 guardian preview</small>
            <h3>Shardback, the Crystal Boss</h3>
            <p>Loud, theatrical, deeply fair, and secretly impressed by learners who change strategies instead of giving up.</p>
            <blockquote>“A fast answer is good. An answer you understand is stronger.”</blockquote>
          </div>
        </div>
      </div>

      <div className="panel avatar-shop" id="shop">
        <div className="panel-head shop-heading">
          <div><p className="eyebrow">Shop Hut</p><h2>Avatar Gear</h2></div>
          <span className="rock-balance">🪨 {profile.shinyRocks}</span>
        </div>
        <div className="weekly-feature-banner"><span>✨ Weekly features</span><strong>{featuredIds.length} rotating items</strong><small>Basic gear stays available. Purchased gear never disappears.</small></div>
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
              const equipped = profile.equippedCosmetics?.[item.slot] === item.id;
              const featured = featuredIds.includes(item.id);
              return (
                <button key={item.id} className={`shop-item-tile ${selected?.id === item.id ? 'selected' : ''} ${equipped ? 'equipped' : ''}`} onClick={() => setSelectedId(item.id)}>
                  {featured && <span className="featured-ribbon">Featured</span>}
                  <div className="tile-art">{item.type === 'bandana' ? <div className={`bandana-preview bandana-${item.bandanaStyle}`}><i /><b /></div> : <span>{item.emoji}</span>}</div>
                  <strong>{item.name}</strong>
                  <small>{equipped ? 'Equipped' : owned ? 'Owned' : item.unlock ? 'World reward' : `${item.cost} 🪨`}</small>
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="shop-detail-card">
              <div className="shop-preview-stage">
                {selected.slot === 'dogNeck'
                  ? <PurpleDog equippedBandana={selected.id} trick="wave" preview />
                  : <MonkeAvatar styleId={profile.monkeStyle} equippedCosmetics={previewEquipment} size="shop" pose="idle" showName />}
              </div>
              <div className="shop-detail-copy">
                <small>{selected.tier || 'Monke gear'}</small>
                <h3>{selected.name}</h3>
                <p>{selected.description}</p>
                <div className="slot-explanation"><span>Attachment slot</span><strong>{selected.slot === 'monkeHead' ? 'Head' : selected.slot === 'monkeBack' ? 'Back' : selected.slot === 'monkeTrail' ? 'Movement trail' : 'Purple’s neck'}</strong></div>
                <div className="shop-status-row"><span>{selectedEquipped ? 'Currently equipped' : selectedOwned ? 'Ready to equip' : selected.unlock ? 'Earn through World One' : `Costs ${selected.cost} Shiny Rocks`}</span></div>
                <button className="shop-equip-button" onClick={() => buyItem(selected)} disabled={selectedEquipped}>
                  {selectedEquipped ? 'Equipped ✓' : selectedOwned ? 'Equip item' : selected.unlock ? 'Earn from the Waterfall Guardian' : `Buy and equip · ${selected.cost} 🪨`}
                </button>
              </div>
            </div>
          )}
        </div>

        <button className="ghost-btn full-width" onClick={useBanana} disabled={bananaDisabled}>
          {profile.energy >= 100 ? 'Energy is already full' : profile.bananas <= 0 ? 'No bananas available' : 'Use 1 banana for +20 energy'}
        </button>
      </div>
    </section>
  );
}
