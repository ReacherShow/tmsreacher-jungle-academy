export default function PurpleDog({ equippedCosmetic, trick = 'walk' }) {
  const hasBandana = equippedCosmetic === 'dog-bandana';

  return (
    <div className={`purple-pup pup-${trick}`} aria-label={`Purple the dog ${hasBandana ? 'wearing a bandana' : ''}`}>
      <div className="pup-shadow" />
      <div className="pup-tail"><span /></div>
      <div className="pup-body">
        <div className="pup-leg pup-leg-back"><i /></div>
        <div className="pup-leg pup-leg-front"><i /></div>
      </div>
      <div className="pup-neck">
        {hasBandana && <div className="pup-bandana"><i /></div>}
      </div>
      <div className="pup-head">
        <div className="pup-ear pup-ear-left" />
        <div className="pup-ear pup-ear-right" />
        <div className="pup-face">
          <span className="pup-eye pup-eye-left" />
          <span className="pup-eye pup-eye-right" />
          <span className="pup-muzzle"><i /></span>
        </div>
        <div className="pup-wave-paw" />
      </div>
      <span className="pup-name">Purple</span>
    </div>
  );
}
