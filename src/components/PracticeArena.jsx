import { useEffect, useMemo, useState } from 'react';
import {
  createProblem,
  getLearningStrategies,
  getSubjectRange,
  isCorrectAnswer,
  needsReview,
  recordStrategyPreference,
  updateProfile
} from '../math/adaptiveEngine.js';

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
  const [problem, setProblem] = useState(() => createProblem(profile, 'multiplication'));
  const [input, setInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [message, setMessage] = useState('Solve the vine gate. Use a learning tool whenever your brain needs a lantern.');
  const [timeLeft, setTimeLeft] = useState(90);
  const [feedback, setFeedback] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [sessionWins, setSessionWins] = useState(0);
  const skill = profile.skills?.[subject] || { level: 1, total: 0, correct: 0, reviewQueue: [] };
  const range = getSubjectRange(subject, skill);
  const strategies = useMemo(() => getLearningStrategies(problem), [problem]);

  useEffect(() => {
    loadProblem(createProblem(profile, subject, false));
  }, [subject]);

  useEffect(() => {
    if (mode !== 'timed') return;
    if (timeLeft <= 0) {
      setMessage('Timer done. Take a breath, then start another climb.');
      return;
    }
    const id = setTimeout(() => setTimeLeft((current) => current - 1), 1000);
    return () => clearTimeout(id);
  }, [mode, timeLeft]);

  function loadProblem(nextProblem) {
    setProblem(nextProblem);
    setShowHint(false);
    setInput('');
    setFeedback(null);
    setRetrying(false);
    setShowReflection(false);
  }

  function nextProblem(nextProfile = profile, forceReview = reviewMode) {
    loadProblem(createProblem(nextProfile, subject, forceReview));
    setMessage(forceReview ? 'Review vine ready. Pull this fact back from memory.' : 'New vine gate ready.');
  }

  function submitAnswer(event) {
    event.preventDefault();
    if (!input.trim() || feedback) return;

    const wasCorrect = isCorrectAnswer(input, problem);
    const attemptMode = retrying ? 'guided-retry' : 'practice';
    const nextProfile = updateProfile(profile, problem, wasCorrect, attemptMode);
    setProfile(nextProfile);

    if (wasCorrect) {
      setSessionWins((current) => Math.min(10, current + 1));
      setFeedback({
        correct: true,
        title: retrying ? 'You rebuilt it!' : 'Monke Tag!',
        equation: `${problem.display} = ${problem.answer}`,
        detail: retrying ? '+2 Shiny Rocks · review scheduled' : '+8 Shiny Rocks · +1 banana'
      });
      setShowReflection(retrying || showHint);
      setMessage(retrying ? 'The picture and strategy helped turn a miss into understanding.' : 'Correct. The vine gate swings open.');
      setRetrying(false);
      if (reviewMode && !needsReview(nextProfile, subject)) setReviewMode(false);
    } else {
      setFeedback({
        correct: false,
        title: 'Vine blocked',
        equation: `${problem.display} = ${problem.answer}`,
        detail: 'Study one strategy, then solve this exact problem again.'
      });
      setShowHint(true);
      setRetrying(true);
      setMessage('A wrong answer is a map marker, not a dead end. See it, choose a strategy, and retrieve it again.');
      if (needsReview(nextProfile, subject)) setReviewMode(true);
    }
    setInput('');
  }

  function beginRetry() {
    setFeedback(null);
    setMessage(`Try ${problem.display} again without copying the answer. Use the model if you need it.`);
  }

  function continueAfterSuccess() {
    nextProblem(profile, reviewMode);
  }

  function chooseReflection(strategyId) {
    setProfile((current) => recordStrategyPreference(current, strategyId));
    setShowReflection(false);
    setMessage('Monke saved that learning strategy for future hints.');
  }

  function restoreEnergyWithRocks() {
    if (profile.shinyRocks < 25) {
      setMessage('Need 25 Shiny Rocks to restore energy this way. Try a banana snack from the treehouse.');
      return;
    }
    setProfile({ ...profile, energy: 100, shinyRocks: Math.max(0, profile.shinyRocks - 25) });
    setMessage('Energy restored with Shiny Rocks. Monke is ready to climb again.');
  }

  function startReview() {
    setReviewMode(true);
    setMessage('Review round started. These facts are due because spaced practice works better than one giant cram session.');
    loadProblem(createProblem(profile, subject, true));
  }

  const placeholder = problem.type === 'fraction' ? 'Example: 3/4' : problem.type === 'decimal' ? 'Example: 4.7' : retrying ? 'Try the same answer again' : 'Answer';

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

      <div className="mission-track" aria-label={`${sessionWins} of 10 vine gates opened`}>
        <div className="mission-copy"><strong>Daily vine mission</strong><span>{sessionWins}/10 gates opened</span></div>
        <div className="mission-vine"><i style={{ width: `${sessionWins * 10}%` }} /><b style={{ left: `calc(${sessionWins * 10}% - 14px)` }}>🦍</b></div>
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
          <strong>Spaced review ready:</strong> these {subject} skills are due to return.
          <button className="mini-btn" onClick={startReview}>Start review</button>
        </div>
      )}

      <div className={`challenge-card ${feedback?.correct ? 'challenge-success' : feedback ? 'challenge-error' : ''}`}>
        <div className="problem">{problem.display}</div>
        <form onSubmit={submitAnswer} className="answer-form">
          <input
            inputMode={problem.type === 'fraction' ? 'text' : 'decimal'}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={placeholder}
            autoFocus
            disabled={Boolean(feedback)}
          />
          <button type="submit" disabled={Boolean(feedback)}>{retrying ? 'Try again' : 'Tag it'}</button>
        </form>

        {!feedback && (
          <div className="hint-row">
            <button className="mini-btn" type="button" onClick={() => setShowHint(!showHint)}>{showHint ? 'Hide learning lab' : 'Open learning lab'}</button>
            <span>Pictures, break-apart strategies, and mental math tools are always free.</span>
          </div>
        )}

        {showHint && <LearningLab strategies={strategies} problem={problem} />}

        {feedback && (
          <div className={`answer-feedback ${feedback.correct ? 'answer-correct' : 'answer-wrong'}`} role="status" aria-live="assertive">
            <div className="feedback-symbol" aria-hidden="true">{feedback.correct ? '✓' : '✕'}</div>
            <div className="feedback-copy">
              <span className="feedback-monke">{feedback.correct ? '🦍' : '🌋'}</span>
              <strong>{feedback.title}</strong>
              <b>{feedback.equation}</b>
              <p>{feedback.detail}</p>
            </div>
            <button className={feedback.correct ? 'primary-btn' : 'retry-btn'} onClick={feedback.correct ? continueAfterSuccess : beginRetry}>
              {feedback.correct ? 'Next vine gate' : 'Study and retry'}
            </button>
          </div>
        )}

        {showReflection && feedback?.correct && (
          <div className="reflection-card">
            <strong>What helped your brain?</strong>
            <p>There is no wrong choice. This teaches Monke which explanations work best for you.</p>
            <div className="reflection-options">
              {strategies.map((strategy) => <button key={strategy.id} onClick={() => chooseReflection(strategy.id)}>{strategy.label}</button>)}
              <button onClick={() => chooseReflection('retrieval')}>I remembered it</button>
            </div>
          </div>
        )}

        <p className="message" aria-live="polite">{message}</p>
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

function LearningLab({ strategies, problem }) {
  const [selected, setSelected] = useState(0);
  const strategy = strategies[selected] || strategies[0];

  useEffect(() => setSelected(0), [problem.key]);

  return (
    <div className="learning-lab">
      <div className="strategy-tabs" role="tablist" aria-label="Choose a learning strategy">
        {strategies.map((item, index) => (
          <button key={item.id} className={selected === index ? 'active' : ''} onClick={() => setSelected(index)} type="button">{item.label}</button>
        ))}
      </div>
      <div className="hint-card">
        <strong>{strategy.label}</strong>
        <p>{strategy.tip}</p>
        <StrategyModel strategy={strategy} problem={problem} />
        <small>Try to explain the picture or steps out loud before entering the answer.</small>
      </div>
    </div>
  );
}

function StrategyModel({ strategy, problem }) {
  if (strategy.model === 'groups') return <GroupModel groups={strategy.groups} />;
  if (strategy.model === 'bar') return <div className="bar-model">{strategy.bars.map((bar, index) => <div key={index} style={{ flex: Math.max(1, bar) }}>{bar}</div>)}</div>;
  if (strategy.model === 'numberline') return <div className="number-line"><span>{strategy.start}</span><i /><span>{strategy.end}</span></div>;
  if (strategy.model === 'fractions') return <div className="fraction-model">{Array.from({ length: strategy.den }, (_, index) => <span key={index} className={index < strategy.parts[0] + strategy.parts[1] ? 'filled' : ''} />)}</div>;
  if (strategy.model === 'decimal') return <div className="decimal-grid">{Array.from({ length: 10 }, (_, index) => <span key={index} className={index < Math.round((Number(problem.answer) % 1) * 10) ? 'filled' : ''} />)}</div>;
  if (strategy.model === 'skip-count') return <div className="skip-count-path">{strategy.sequence.map((value, index) => <span key={value}><i>{index + 1}</i>{value}</span>)}</div>;
  if (strategy.model === 'equation') return <div className="equation-steps">{strategy.equation.map((step, index) => <span key={`${step}-${index}`}>{step}{index < strategy.equation.length - 1 && <b>↓</b>}</span>)}</div>;
  return null;
}

function GroupModel({ groups }) {
  const [counted, setCounted] = useState([]);

  function toggleGroup(index) {
    setCounted((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  }

  return (
    <div>
      <p className="model-instruction">Tap each row as you count it.</p>
      <div className="number-blocks interactive-groups" aria-label="Interactive multiplication groups">
        {groups.slice(0, 12).map((group, index) => (
          <button type="button" className={counted.includes(index) ? 'counted' : ''} onClick={() => toggleGroup(index)} key={group.id}>
            <i>{index + 1}</i>
            <span className="group-dots">{Array.from({ length: Math.min(group.count, 12) }, (_, dot) => <b key={dot} />)}</span>
          </button>
        ))}
      </div>
      <strong className="counted-label">Rows counted: {counted.length} of {Math.min(groups.length, 12)}</strong>
    </div>
  );
}
