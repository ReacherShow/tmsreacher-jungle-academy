import { maps } from '../data/maps.js';

export default function WorldMap({ profile, cosmetics, buyItem, shopMessage, useBanana }) {
  const bananaDisabled = profile.bananas <= 0 || profile.energy >= 100;

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
      <div className="panel" id="shop">
        <p className="eyebrow">Shop Hut</p>
        <h2>Shiny Rock Store</h2>
        <p className="shop-message" aria-live="polite">{shopMessage}</p>
        <div className="shop-list">
          {cosmetics.map((item) => {
            const owned = profile.ownedCosmetics.includes(item.id);
            const equipped = profile.equippedCosmetics?.[item.slot] === item.id || profile.equippedCosmetic === item.id;
            return (
              <article className={`shop-card ${item.type === 'bandana' ? 'bandana-shop-card' : ''}`} key={item.name}>
                {item.type === 'bandana' ? (
                  <div className={`bandana-preview bandana-${item.bandanaStyle}`} aria-label={`${item.name} preview`}><i /><b /></div>
                ) : <span>{item.emoji}</span>}
                <div className="shop-card-copy">
                  {item.tier && <em>{item.tier}</em>}
                  <strong>{item.name}</strong>
                  <small>{item.description}</small>
                </div>
                <button className="mini-btn" onClick={() => buyItem(item)}>
                  {equipped ? 'Equipped' : owned ? 'Equip' : `Buy ${item.cost} 🪨`}
                </button>
              </article>
            );
          })}
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
