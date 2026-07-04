const BANDANA_STYLES = {
  'dog-bandana': 'leaf',
  'dog-bandana-waterfall': 'waterfall',
  'dog-bandana-crystal': 'crystal',
  'dog-bandana-legend': 'legend'
};

export default function PurpleDog({ equippedBandana, trick = 'walk', preview = false }) {
  const bandanaStyle = BANDANA_STYLES[equippedBandana] || null;

  return (
    <div className={`purple-pup pup-${trick} ${preview ? 'pup-preview' : ''}`} aria-label={`Purple the dog ${bandanaStyle ? `wearing the ${bandanaStyle} bandana` : ''}`}>
      <div className="pup-shadow" />
      <div className="pup-tail"><span /></div>
      <div className="pup-body">
        <div className="pup-leg pup-leg-back"><i /></div>
        <div className="pup-leg pup-leg-front"><i /></div>
      </div>
      <div className="pup-neck">
        {bandanaStyle && <div className={`pup-bandana bandana-${bandanaStyle}`}><i /><b /></div>}
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
      {!preview && <span className="pup-name">Purple</span>}
    </div>
  );
}
