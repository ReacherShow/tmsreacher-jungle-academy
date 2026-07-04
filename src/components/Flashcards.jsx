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
  const [message, setMessage] = useState('Flashcards are quick reps. Flip, answer, and notice what your brain remembers.');
  const [feedback, setFeedback] = useState(null);
  const hint = getHint(card);

  function changeDeck(nextDeck) {
    setDeck(nextDeck);
    setCard(createProblem(profile, nextDeck));
    setFlipped(false);
    setGuess('');
    setFeedback(null);
  }

  function next(nextProfile = profile) {
    setCard(createProblem(nextProfile, deck));
    setFlipped(false);
    setGuess('');
    setFeedback(null);
  }

  function mark(correct) {
    if (feedback) return;
    const nextProfile = updateProfile(profile, card, correct, 'flashcards');
    setProfile(nextProfile);
    setFlipped(true);
    setFeedback({
      correct,
      title: correct ? 'Solved!' : 'Review added',
      detail: correct ? '+8 XP · +4 Shiny Rocks' : `Answer: ${card.answer} · This card will return`
    });
    setMessage(correct ? 'That fact is moving deeper into memory.' : 'No penalty spiral. Study the strategy, then meet the card again.');
    window.setTimeout(() => next(nextProfile), 1450);
  }

  function submit(event) {
    event.preventDefault();
    if (!guess.trim()) return;
    mark(isCorrectAnswer(guess, card));
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
        <button className={`flashcard ${flipped ? 'flipped' : ''} ${feedback?.correct ? 'card-correct' : ''} ${feedback && !feedback.correct ? 'card-review' : ''}`} onClick={() => !feedback && setFlipped(!flipped)}>
          <span>{flipped ? card.answer : card.display}</span>
          <small>{feedback ? 'Next card loading…' : flipped ? 'Tap for question' : 'Tap to flip'}</small>
          {feedback && (
            <div className={`flash-feedback ${feedback.correct ? 'success' : 'review'}`} role="status">
              <strong>{feedback.correct ? '✓' : '↻'} {feedback.title}</strong>
              <span>{feedback.detail}</span>
            </div>
          )}
        </button>
        <div className="study-panel">
          <form onSubmit={submit} className="answer-form compact">
            <input value={guess} onChange={(event) => setGuess(event.target.value)} placeholder="Try answer" disabled={Boolean(feedback)} />
            <button disabled={Boolean(feedback)}>Check</button>
          </form>
          <div className="button-row tight">
            <button className="mini-btn" onClick={() => setFlipped(true)} disabled={Boolean(feedback)}>Show answer</button>
            <button className="mini-btn" onClick={() => mark(true)} disabled={Boolean(feedback)}>Got it</button>
            <button className="mini-btn" onClick={() => mark(false)} disabled={Boolean(feedback)}>Need review</button>
          </div>
          <div className="hint-card small-hint">
            <strong>Study tip</strong>
            <p>{hint.tip}</p>
          </div>
          <p className={`message flash-message ${feedback ? 'highlight' : ''}`} aria-live="polite">{message}</p>
        </div>
      </div>
    </section>
  );
}
