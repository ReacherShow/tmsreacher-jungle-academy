import { starterMonkes } from '../data/maps.js';

export default function MonkeAvatar({ styleId = 'jungle-monke', equippedCosmetics = {}, size = 'world', pose = 'idle', showName = false }) {
  const style = starterMonkes.find((item) => item.id === styleId) || starterMonkes[0];
  const head = equippedCosmetics?.monkeHead;
  const back = equippedCosmetics?.monkeBack;
  const trail = equippedCosmetics?.monkeTrail;

  return (
    <div
      className={`monke-avatar monke-${size} pose-${pose} ${trail === 'waterfall-dash' ? 'has-waterfall-dash' : ''}`}
      style={{ '--monke-fur': style.fur, '--monke-face': style.face, '--monke-accent': style.accent }}
      aria-label={`${style.name}${head ? ` wearing ${head}` : ''}${back ? ` with ${back}` : ''}`}
    >
      {trail === 'waterfall-dash' && <span className="avatar-trail" aria-hidden="true"><i /><b /><em /></span>}
      {back && <span className={`avatar-back-slot gear-${back}`} aria-hidden="true">{back === 'crystal-pack' ? '💎' : '🎒'}</span>}
      <span className="avatar-body"><i className="avatar-belly" /></span>
      <span className="avatar-arm arm-left"><i /></span>
      <span className="avatar-arm arm-right"><i /></span>
      <span className="avatar-head">
        <i className="avatar-ear ear-left" /><i className="avatar-ear ear-right" />
        <b className="avatar-face"><i className="avatar-eye eye-left" /><i className="avatar-eye eye-right" /><em className="avatar-muzzle" /></b>
      </span>
      {head && <span className={`avatar-head-slot gear-${head}`} aria-hidden="true">{head === 'leaf-crown' ? '🌿' : '👑'}</span>}
      <span className="avatar-foot foot-left" /><span className="avatar-foot foot-right" />
      {showName && <strong className="avatar-name">{style.name}</strong>}
    </div>
  );
}
