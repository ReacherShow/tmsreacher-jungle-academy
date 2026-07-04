import { maps } from '../data/maps.js';

export default function WorldMap({ profile, cosmetics, buyItem, shopMessage, useBanana }) {
  return (
    <section className="world-grid">
      <div className="panel">
        <p className="eyebrow">Unlockable Maps</p>
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
      <div className="panel">
        <p className="eyebrow">Shop</p>
        <h2>Shiny Rock Store</h2>
        <p className="shop-message">{shopMessage}</p>
        <div className="shop-list">
          {cosmetics.map((item) => {
            const owned = profile.ownedCosmetics.includes(item.id);
            const equipped = profile.equippedCosmetic === item.id;
            return (
              <article className="shop-card" key={item.name}>
                <span>{item.emoji}</span>
                <strong>{item.name}</strong>
                <small>{item.description}</small>
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
        <button className="ghost-btn full-width" onClick={useBanana}>Use 1 banana for +20 energy</button>
      </div>
    </section>
  );
}
