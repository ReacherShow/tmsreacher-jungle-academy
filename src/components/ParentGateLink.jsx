import { useEffect, useState } from 'react';

export default function ParentGateLink({ href, className = '', children }) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState('This link leaves Jungle Academy. A grown-up should open it.');

  useEffect(() => {
    if (!open) {
      setAnswer('');
      setMessage('This link leaves Jungle Academy. A grown-up should open it.');
    }
  }, [open]);

  function confirm(event) {
    event.preventDefault();
    if (answer.trim() !== '45') {
      setMessage('Not quite. Ask a grown-up to help with the parent gate.');
      return;
    }
    window.open(href, '_blank', 'noopener,noreferrer');
    setOpen(false);
  }

  return (
    <>
      <button className={className} type="button" onClick={() => setOpen(true)}>{children}</button>
      {open && (
        <div className="modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div className="parent-gate" role="dialog" aria-modal="true" aria-labelledby="parent-gate-title" onClick={(event) => event.stopPropagation()}>
            <p className="eyebrow">Parent gate</p>
            <h2 id="parent-gate-title">Grown-up check</h2>
            <p>{message}</p>
            <form onSubmit={confirm}>
              <label htmlFor="parent-answer">What is 17 + 28?</label>
              <input id="parent-answer" inputMode="numeric" value={answer} onChange={(event) => setAnswer(event.target.value)} autoFocus />
              <div className="button-row">
                <button className="primary-btn" type="submit">Open YouTube</button>
                <button className="ghost-btn" type="button" onClick={() => setOpen(false)}>Stay here</button>
              </div>
            </form>
            <small>Prototype gate. Parent account verification will replace this before App Store release.</small>
          </div>
        </div>
      )}
    </>
  );
}
