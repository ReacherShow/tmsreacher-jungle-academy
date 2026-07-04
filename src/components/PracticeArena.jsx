import { useEffect, useMemo, useState } from 'react';
import { createProblem, getHint, getSubjectRange, isCorrectAnswer, needsReview, updateProfile } from '../math/adaptiveEngine.js';

const subjects = [
  { id: 'addition', label: 'Addition', icon: '➕' },
  { id: 'subtraction', label: 'Subtraction', icon: '➖' },
  { id: 'multiplication', label: 'Multiplication', icon: '✖️' },
  { id: 'fractions', label: 'Fractions', icon: '🍕' },
  { id: 'decimals', label: 'Decimals', icon: '🔢' }
];

export default function PracticeArena({ profile, setProfile }) {
  const [subject, setSubject] = useState('multiplication');
  const [mode, setMode] = useState('relaxed');
  const [reviewMode, setReviewMode] = useState(false);
  const [problem, setProblem] = useState(() => createProblem(profile, subject));
  const [input, setInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [message, setMessage] = useState('Choose a skill, solve vine gates, and use hints whenever your brain needs a lantern.');
  const [timeLeft, setTimeLeft] = useState(90);
  const skill = profile.skills?.[subject] || { level: 1, total: 0, correct: 0, reviewQueue: [] };
  const range = getSubjectRange(subject, skill);
  const hint = useMemo(() => getHint(problem), [problem]);

  useEffect(() => {
    setProblem(createProblem(profile, subject, reviewMode));
    setShowHint(false);
    setInput('');
  }, [subject]);

  useEffect(() => {
    if (mode !== 'timed') return;
    if (timeLeft <= 0) {
      setMessage('Timer done. Take a breath, then start another climb.');
      return;
    }
    const id = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(id);
  }, [mode, timeLeft]);

  function nextProblem(nextProfile = profile, forceReview = reviewMode) {
    setProblem(createProblem(nextProfile, subject, forceReview));
    setShowHint(false);
  }

  function submitAnswer(event) {
    event.preventDefault();
    const wasCorrect = isCorrectAnswer(input, problem);
    const nextProfile = updateProfile(profile, problem, wasCorrect, 'practice');
    setProfile(nextProfile);
    if (wasCorrect) {
      setMessage('Correct! The vine swings open. +8 Shiny Rocks, +1 banana.');
      if (reviewMode && !needsReview(nextProfile, subject)) setReviewMode(false);
    } else {
      setMessage(`Not yet. Try the hint first. ${problem.display} will return in review so it sticks.`);
      setShowHint(true);
      if (needsReview(nextProfile, subject)) setReviewMode(true);
    }
    nextProblem(nextProfile, reviewMode);
    setInput('');
  }

  function restoreEnergyWithRocks() {
    if (profile.shinyRocks < 25) {
      setMessage('Need 25 Shiny Rocks to restore energy this way. Try a banana snack from the top section.');
      return;
    }
    setProfile({ ...profile, energy: 100, shinyRocks: Math.max(0, profile.shinyRocks - 25) });
    setMessage('Energy restored with Shiny Rocks. Monke is ready to climb again.');
  }

  function startReview() {
    setReviewMode(true);
    setMessage('Review round started. These are the facts Monke has missed most recently.');
    nextProblem(profile, true);
  }

  const placeholder = problem.type === 'fraction' ? 'Example: 3/4' : problem.type === 'decimal' ? 'Example: 4.7' : 'Answer';

  return (
    <section id="practice" className="panel arena level-theme theme-jungle">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Adaptive Practice · {range.label}</p>
          <h2>{reviewMode ? 'Review Vine Loop' : 'Practice Arena'}</h2>
        </div>
        <div className="toggle-group">
          <button className={mode === 'relaxed' ? 'active' : ''} onClick={() => setMode('relaxed')}>Relaxed</button>
          <button className={mode === 'timed' ? 'active' : ''} onClick={() => { setMode('timed'); setTimeLeft(90); }}>Timed</button>
        </div>
      </div>

      <div className="subject-tabs">
        {subjects.map((item) => (
          <button key={item.id} className={subject === item.id ? 'active' : ''} onClick={() => { setSubject(item.id); setReviewMode(false); }}>
            <span>{item.icon}</span>{item.label}
          </button>
        ))}
      </div>

      {needsReview(profile, subject) && !reviewMode && (
        <div className="review-banner">
          <strong>Review ready:</strong> Monke has a few {subject} skills to practice again.
          <button className="mini-btn" onClick={startReview}>Start review</button>
        </div>
      )}
      <div className="challenge-card">
        <div className="problem">{problem.display}</div>
        <form onSubmit={submitAnswer} className="answer-form">
          <input inputMode={problem.type === 'fraction' ? 'text' : 'decimal'} value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder} autoFocus />
          <button type="submit">Tag it</button>
        </form>
        <div className="hint-row">
          <button className="mini-btn" type="button" onClick={() => setShowHint(!showHint)}>{showHint ? 'Hide tools' : 'Show learning tools'}</button>
          <span>Visuals, number blocks, and mental math tips are always free.</span>
        </div>
        {showHint && <HintCard hint={hint} problem={problem} />}
        <p className="message">{message}</p>
        {mode === 'timed' && <p className="timer">⏱ {timeLeft}s left</p>}
      </div>
      <div className="stat-row">
        <span>Skill L{skill.level}</span>
        <span>⚡ Energy {profile.energy}%</span>
        <span>🔥 Answer streak {profile.answerStreak}</span>
        <span>🔁 Review {(skill.reviewQueue ?? []).length}</span>
        <button className="mini-btn" onClick={restoreEnergyWithRocks}>Restore Energy, 25 🪨</button>
      </div>
    </section>
  );
}

function HintCard({ hint, problem }) {
  return (
    <div className="hint-card">
      <strong>Learning tool</strong>
      <p>{hint.tip}</p>
      {hint.model === 'groups' && (
        <div className="number-blocks" aria-label="Visual multiplication groups">
          {hint.groups.slice(0, 12).map((group) => (
            <div className="block-group" key={group.id}>
              {Array.from({ length: Math.min(group.count, 12) }, (_, i) => <span key={i}></span>)}
            </div>
          ))}
        </div>
      )}
      {hint.model === 'bar' && <div className="bar-model">{hint.bars.map((bar, i) => <div key={i} style={{ flex: Math.max(1, bar) }}>{bar}</div>)}</div>}
      {hint.model === 'numberline' && <div className="number-line"><span>{hint.start}</span><i></i><span>{hint.end}</span></div>}
      {hint.model === 'fractions' && <div className="fraction-model">{Array.from({ length: hint.den }, (_, i) => <span key={i} className={i < hint.parts[0] + hint.parts[1] ? 'filled' : ''}></span>)}</div>}
      {hint.model === 'decimal' && <div className="decimal-grid">{Array.from({ length: 10 }, (_, i) => <span key={i} className={i < Math.round((problem.answer % 1) * 10) ? 'filled' : ''}></span>)}</div>}
      <small>Answer format: {problem.type === 'fraction' ? 'Use a slash, like 3/4.' : problem.type === 'decimal' ? 'Use a decimal point.' : 'Whole number.'}</small>
    </div>
  );
}
