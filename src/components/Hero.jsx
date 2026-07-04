export default function Hero({ profile, useBanana, dailyMessage }) {
  const crown = profile.equippedCosmetic === 'crown' || profile.equippedCosmetic === 'crystal-pack';
  return (
    <section className="hero-card level-theme theme-jungle">
      <a className="youtube-pill" href="https://youtube.com/@tmsreacher" target="_blank" rel="noreferrer"><span className="play">▶</span> TMS REACHER</a>
      <div className="hero-grid">
        <div>
          <p className="eyebrow">Level 1: Jungle World</p>
          <h1>TMS REACHER: Jungle Academy</h1>
          <p className="lede">Help Monke master math, collect Shiny Rocks, unlock themed maps, and train with a dancing tiny purple dog sidekick.</p>
          <div className="streak-card">🔥 {dailyMessage}</div>
          <div className="button-row">
            <a className="primary-btn" href="#practice">Start challenge</a>
            <a className="ghost-btn" href="#dashboard">Dad dashboard</a>
            <button className="ghost-btn" onClick={useBanana}>Use banana snack</button>
          </div>
        </div>
        <div className="monke-stage jungle-stage" aria-label="Jungle level preview">
          <div className="sun"></div>
          <div className="vines vine-a"></div>
          <div className="vines vine-b"></div>
          <div className="waterfall"></div>
          <div className="tree-platform"></div>
          <div className="monke">{crown ? '👑' : ''}🦍</div>
          <div className="dog purple-dog">🐶</div>
          <div className="floating-rocks">🪨 {profile.shinyRocks}</div>
        </div>
      </div>
    </section>
  );
}
