import { useState } from 'react';
import { createProblem, getHint, isCorrectAnswer, updateProfile } from '../math/adaptiveEngine.js';

const deckOptions = [
  { id: 'multiplication', label: 'Multiplication facts' },
  { id: 'addition', label: 'Addition' },
  { id: 'subtraction', label: 'Subtraction' },
  { id: 'fractions', label: 'Fractions' },
  { id: 'decimals', label: 'Decimals' }
];

export default function Flashcards({ profile, setProfile }) {
  const [deck, setDeck] = useState('multiplication');
  const [card, setCard] = useState(() => createProblem(profile, 'multiplication'));
  const [flipped, setFlipped] = useState(false);
  const [guess, setGuess] = useState('');
  const [message, setMessage] = useState('Flashcards are quick reps. Flip, answer, and mark how it felt.');
  const hint = getHint(card);

  function changeDeck(nextDeck) {
    setDeck(nextDeck);
    setCard(createProblem(profile, nextDeck));
    setFlipped(false);
    setGuess('');
  }

  function next(nextProfile = profile) {
    setCard(createProblem(nextProfile, deck));
    setFlipped(false);
    setGuess('');
  }

  function mark(correct) {
    const nextProfile = updateProfile(profile, card, correct, 'flashcards');
    setProfile(nextProfile);
    setMessage(correct ? 'Nice rep. The card goes deeper into memory.' : 'Marked for review. No shame, just another vine to climb.');
    next(nextProfile);
  }

  function submit(e) {
    e.preventDefault();
    const correct = isCorrectAnswer(guess, card);
    mark(correct);
  }

  return (
    <section className="panel flashcards" id="flashcards">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Flash Card Grove</p>
          <h2>Fast Facts + Study Tools</h2>
        </div>
        <div className="toggle-group">
          {deckOptions.map((option) => <button key={option.id} className={deck === option.id ? 'active' : ''} onClick={() => changeDeck(option.id)}>{option.label}</button>)}
        </div>
      </div>
      <div className="flashcard-grid">
        <button className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
          <span>{flipped ? card.answer : card.display}</span>
          <small>{flipped ? 'Tap for question' : 'Tap to flip'}</small>
        </button>
        <div className="study-panel">
          <form onSubmit={submit} className="answer-form compact">
            <input value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="Try answer" />
            <button>Check</button>
          </form>
          <div className="button-row tight">
            <button className="mini-btn" onClick={() => setFlipped(true)}>Show answer</button>
            <button className="mini-btn" onClick={() => mark(true)}>Got it</button>
            <button className="mini-btn" onClick={() => mark(false)}>Need review</button>
          </div>
          <div className="hint-card small-hint">
            <strong>Study tip</strong>
            <p>{hint.tip}</p>
          </div>
          <p className="message">{message}</p>
        </div>
      </div>
    </section>
  );
}
