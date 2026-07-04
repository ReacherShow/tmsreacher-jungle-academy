import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createProblem,
  getLearningStrategies,
  getSubjectRange,
  isCorrectAnswer,
  needsReview,
  recordSkip,
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

const expeditionStages = [
  { id: 'warmup', label: 'Warm up', at: 0 },
  { id: 'learn', label: 'Learn', at: 2 },
  { id: 'practice', label: 'Practice', at: 3 },
  { id: 'apply', label: 'Apply', at: 7 },
  { id: 'teach', label: 'Teach Purple', at: 8 },
  { id: 'finish', label: 'Finish', at: 9 }
];

export default function PracticeArena({ profile, setProfile }) {
  const [subject, setSubject] = useState('multiplication');
  const [mode, setMode] = useState('guided');
  const [reviewMode, setReviewMode] = useState(false);
  const [problem, setProblem] = useState(() => createProblem(profile, 'multiplication'));
  const [input, setInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [message, setMessage] = useState('Start with what you know. A learning tool is always one tap away.');
  const [timeLeft, setTimeLeft] = useState(90);
  const [feedback, setFeedback] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [sessionWins, setSessionWins] = useState(0);
  const challengeRef = useRef(null);

  const skill = profile.skills?.[subject] || { level: 1, total: 0, correct: 0, reviewQueue: [] };
  const range = getSubjectRange(subject, skill);
  const strategies = useMemo(() => getLearningStrategies(problem), [problem]);
  const isApplicationStep = mode === 'guided' && sessionWins === 7;
  const isTeachStep = mode === 'guided' && sessionWins === 8;
  const isComplete = mode === 'guided' && sessionWins >= 10;
  const application = useMemo(() => makeApplicationChallenge(problem), [problem]);

  useEffect(() => {
    loadProblem(createProblem(profile, subject, false));
    setSessionWins(0);
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

  useEffect(() => {
    if (feedback && challengeRef.current) {
      challengeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [feedback]);

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
    const attemptMode = retrying
      ? 'guided-retry'
      : reviewMode
        ? 'review'
        : isApplicationStep
          ? 'application'
          : 'practice';
    const nextProfile = updateProfile(profile, problem, wasCorrect, attemptMode);
    setProfile(nextProfile);

    if (wasCorrect) {
      const nextWins = Math.min(10, sessionWins + 1);
      setSessionWins(nextWins);
      setFeedback({
        correct: true,
        title: isApplicationStep ? 'Jungle problem solved!' : retrying ? 'You rebuilt it!' : 'Monke Tag!',
        equation: `${problem.display} = ${problem.answer}`,
        detail: isApplicationStep
          ? 'You used the math in a new situation. That is real mastery.'
          : retrying
            ? '+2 Shiny Rocks · this fact will return later'
            : '+8 Shiny Rocks · +1 banana'
      });
      setShowReflection(retrying || showHint);
      setMessage(nextWins >= 10 ? 'Expedition complete.' : 'The next step is ready right here.');
      setRetrying(false);
      if (reviewMode && !needsReview(nextProfile, subject)) setReviewMode(false);
    } else {
      setFeedback({
        correct: false,
        title: 'Let’s build it together',
        equation: `${problem.display} = ${problem.answer}`,
        detail: 'The answer stays on screen. Pick a visual tool, retry, or skip it for today.'
      });
      setShowHint(true);
      setRetrying(true);
      setMessage('A miss is information. We change the representation, not the learner.');
      if (needsReview(nextProfile, subject)) setReviewMode(true);
    }
    setInput('');
  }

  function beginRetry() {
    setFeedback(null);
    setShowHint(true);
    setMessage(`Try ${problem.display} again. Use the model, then cover it with your hand before answering.`);
  }

  function continueAfterSuccess() {
    nextProblem(profile, reviewMode);
  }

  function skipCurrentProblem() {
    const nextProfile = recordSkip(profile, problem);
    setProfile(nextProfile);
    nextProblem(nextProfile, false);
    setMessage('Skipped for now. It was added to the review trail and will return with support.');
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
    setMessage('Review round started. These facts are returning after time away.');
    loadProblem(createProblem(profile, subject, true));
  }

  function completeTeachPurple(wasCorrect) {
    if (!wasCorrect) return;
    const nextProfile = updateProfile(profile, problem, true, 'teach-purple');
    setProfile(nextProfile);
    setSessionWins(9);
    setFeedback({
      correct: true,
      title: 'Purple learned it from you!',
      equation: `${problem.display} = ${problem.answer}`,
      detail: 'Explaining a strategy is stronger than recognizing an answer.'
    });
  }

  function restartExpedition() {
    setSessionWins(0);
    setReviewMode(false);
    nextProblem(profile, false);
  }

  const placeholder = problem.type === 'fraction'
    ? 'Example: 3/4'
    : problem.type === 'decimal'
      ? 'Example: 4.7'
      : retrying
        ? 'Try the same answer again'
        : 'Answer';

  return (
    <section id="practice" className="panel arena level-theme theme-jungle">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Adaptive Learning · {range.label}</p>
          <h2>{reviewMode ? 'Review Vine Loop' : mode === 'guided' ? 'Guided Expedition' : 'Practice Arena'}</h2>
        </div>
        <div className="toggle-group">
          <button className={mode === 'guided' ? 'active' : ''} onClick={() => { setMode('guided'); setSessionWins(0); }}>Guided</button>
          <button className={mode === 'relaxed' ? 'active' : ''} onClick={() => setMode('relaxed')}>Free practice</button>
          <button className={mode === 'timed' ? 'active' : ''} onClick={() => { setMode('timed'); setTimeLeft(90); }}>Timed</button>
        </div>
      </div>

      {mode === 'guided' && <ExpeditionGuide wins={sessionWins} />}

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

      <div ref={challengeRef} className={`challenge-card ${feedback?.correct ? 'challenge-success' : feedback ? 'challenge-error' : ''}`}>
        {isComplete ? (
          <ExpeditionComplete profile={profile} onRestart={restartExpedition} />
        ) : feedback ? (
          <FeedbackStage
            feedback={feedback}
            showReflection={showReflection}
            strategies={strategies}
            onReflect={chooseReflection}
            onContinue={continueAfterSuccess}
            onRetry={beginRetry}
            onSkip={skipCurrentProblem}
          />
        ) : isTeachStep ? (
          <TeachPurpleChallenge problem={problem} onComplete={completeTeachPurple} onSkip={skipCurrentProblem} />
        ) : (
          <>
            {isApplicationStep && <ApplicationBanner challenge={application} />}
            <div className="problem">{problem.display}</div>
            <form onSubmit={submitAnswer} className="answer-form">
              <input
                inputMode={problem.type === 'fraction' ? 'text' : 'decimal'}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={placeholder}
                autoFocus
              />
              <button type="submit">{retrying ? 'Try again' : isApplicationStep ? 'Solve the jungle problem' : 'Tag it'}</button>
            </form>

            <div className="problem-actions">
              <button className="mini-btn tool-open" type="button" onClick={() => setShowHint(!showHint)}>
                {showHint ? 'Hide math tools' : 'Show me a way to think'}
              </button>
              <button className="skip-btn" type="button" onClick={skipCurrentProblem}>Skip for now</button>
            </div>

            {showHint && <LearningLab strategies={strategies} problem={problem} />}

            <p className="message" aria-live="polite">{message}</p>
            {mode === 'timed' && <p className="timer">⏱ {timeLeft}s left</p>}
          </>
        )}
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

function ExpeditionGuide({ wins }) {
  const activeIndex = expeditionStages.reduce((best, stage, index) => wins >= stage.at ? index : best, 0);
  return (
    <div className="expedition-guide">
      <div className="expedition-heading">
        <strong>12-minute learning trail</strong>
        <span>{wins}/10 gates</span>
      </div>
      <div className="expedition-stages">
        {expeditionStages.map((stage, index) => (
          <div key={stage.id} className={`${index < activeIndex ? 'done' : ''} ${index === activeIndex ? 'active' : ''}`}>
            <i>{index < activeIndex ? '✓' : index + 1}</i>
            <span>{stage.label}</span>
          </div>
        ))}
      </div>
      <div className="mission-vine"><i style={{ width: `${wins * 10}%` }} /><b style={{ left: `calc(${wins * 10}% - 14px)` }}>🦍</b></div>
    </div>
  );
}

function FeedbackStage({ feedback, showReflection, strategies, onReflect, onContinue, onRetry, onSkip }) {
  return (
    <div className={`feedback-stage ${feedback.correct ? 'answer-correct' : 'answer-wrong'}`} role="status" aria-live="assertive">
      <div className="feedback-symbol" aria-hidden="true">{feedback.correct ? '✓' : '✕'}</div>
      <span className="feedback-monke" aria-hidden="true">{feedback.correct ? '🦍' : '🌿'}</span>
      <strong>{feedback.title}</strong>
      <b>{feedback.equation}</b>
      <p>{feedback.detail}</p>
      {feedback.correct ? (
        <button className="continue-gate" onClick={onContinue}>Continue to the next gate →</button>
      ) : (
        <div className="feedback-actions">
          <button className="retry-btn" onClick={onRetry}>Open tools and retry</button>
          <button className="skip-btn light" onClick={onSkip}>Skip for now</button>
        </div>
      )}
      {showReflection && feedback.correct && (
        <details className="reflection-details">
          <summary>Tell Monke what helped</summary>
          <div className="reflection-options">
            {strategies.map((strategy) => <button key={strategy.id} onClick={() => onReflect(strategy.id)}>{strategy.label}</button>)}
            <button onClick={() => onReflect('retrieval')}>I remembered it</button>
          </div>
        </details>
      )}
    </div>
  );
}

function LearningLab({ strategies, problem }) {
  const [selected, setSelected] = useState(0);
  const strategy = strategies[selected] || strategies[0];

  useEffect(() => setSelected(0), [problem.key]);

  return (
    <div className="learning-lab">
      <div className="cpa-strip" aria-label="Concrete pictorial abstract learning path">
        <span className="active">1. Build it</span><i>→</i><span>2. See it</span><i>→</i><span>3. Write it</span>
      </div>
      <div className="toolbelt" role="tablist" aria-label="Choose a math tool">
        {strategies.map((item, index) => (
          <button key={item.id} className={selected === index ? 'active' : ''} onClick={() => setSelected(index)} type="button">
            <span>{item.icon || '💡'}</span>{item.label}
          </button>
        ))}
      </div>
      <div className="hint-card learning-tool-card">
        <div className="tool-card-heading">
          <div><small>{strategy.cpa || 'Learning tool'}</small><strong>{strategy.label}</strong></div>
          <span>Try it with your hands or eyes</span>
        </div>
        <p>{strategy.tip}</p>
        <StrategyModel strategy={strategy} problem={problem} />
        <div className="abstract-bridge"><span>What you built</span><i>becomes</i><strong>{problem.display} = ?</strong></div>
      </div>
    </div>
  );
}

function StrategyModel({ strategy, problem }) {
  if (strategy.model === 'groups') return <GroupModel groups={strategy.groups} />;
  if (strategy.model === 'bar') return <div className="bar-model">{strategy.bars.map((bar, index) => <div key={index} style={{ flex: Math.max(1, bar) }}>{bar}</div>)}</div>;
  if (strategy.model === 'numberline') return <div className="number-line"><span>{strategy.start}</span><i /><span>{strategy.end}</span></div>;
  if (strategy.model === 'repeated-jumps') return <RepeatedJumpNumberLine strategy={strategy} />;
  if (strategy.model === 'array-grid') return <ArrayGridModel strategy={strategy} />;
  if (strategy.model === 'friendly-fact') return <FriendlyFactModel strategy={strategy} />;
  if (strategy.model === 'mental-move') return <MentalMoveModel strategy={strategy} />;
  if (strategy.model === 'fractions') return <div className="fraction-model">{Array.from({ length: strategy.den }, (_, index) => <span key={index} className={index < strategy.parts[0] + strategy.parts[1] ? 'filled' : ''} />)}</div>;
  if (strategy.model === 'decimal') return <div className="decimal-grid">{Array.from({ length: 10 }, (_, index) => <span key={index} className={index < Math.round((Number(problem.answer) % 1) * 10) ? 'filled' : ''} />)}</div>;
  if (strategy.model === 'skip-count') return <div className="skip-count-path">{strategy.sequence.map((value, index) => <span key={`${value}-${index}`}><i>{index + 1}</i>{value}</span>)}</div>;
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
      <p className="model-instruction">Tap each basket as you count it.</p>
      <div className="number-blocks interactive-groups" aria-label="Interactive equal groups">
        {groups.slice(0, 12).map((group, index) => (
          <button type="button" className={counted.includes(index) ? 'counted' : ''} onClick={() => toggleGroup(index)} key={group.id}>
            <i>{index + 1}</i>
            <span className="basket-icon">🧺</span>
            <span className="group-dots">{Array.from({ length: Math.min(group.count, 12) }, (_, dot) => <b key={dot} />)}</span>
          </button>
        ))}
      </div>
      <strong className="counted-label">Groups counted: {counted.length} of {Math.min(groups.length, 12)}</strong>
    </div>
  );
}

function RepeatedJumpNumberLine({ strategy }) {
  const [revealed, setRevealed] = useState(0);
  const visible = strategy.sequence.slice(0, revealed);
  return (
    <div className="jump-model">
      <div className="jump-track">
        <span className="start-node">0</span>
        {strategy.sequence.map((value, index) => (
          <span key={value} className={index < revealed ? 'revealed' : ''} style={{ left: `${((index + 1) / strategy.jumps) * 100}%` }}>
            {index < revealed ? value : '•'}
          </span>
        ))}
        <i style={{ width: `${(revealed / strategy.jumps) * 100}%` }} />
        <b style={{ left: `calc(${(revealed / strategy.jumps) * 100}% - 14px)` }}>🦍</b>
      </div>
      <div className="jump-copy">{revealed === 0 ? `Ready for ${strategy.jumps} jumps of ${strategy.step}` : visible.join(' → ')}</div>
      <button type="button" className="mini-btn" onClick={() => setRevealed((current) => Math.min(strategy.jumps, current + 1))} disabled={revealed >= strategy.jumps}>
        {revealed >= strategy.jumps ? 'All jumps complete' : `Jump +${strategy.step}`}
      </button>
    </div>
  );
}

function ArrayGridModel({ strategy }) {
  const cells = Array.from({ length: strategy.rows * strategy.cols });
  return (
    <div className="array-tools">
      <div className="array-model" style={{ gridTemplateColumns: `repeat(${strategy.cols}, minmax(12px, 1fr))` }} aria-label={`${strategy.rows} by ${strategy.cols} array`}>
        {cells.map((_, index) => <span key={index} className={`array-row-${Math.floor(index / strategy.cols) % 2}`} />)}
      </div>
      <p className="array-caption">{strategy.rows} rows × {strategy.cols} in each row</p>
      {strategy.patternFactor && <HundredGridPattern factor={strategy.patternFactor} />}
    </div>
  );
}

function HundredGridPattern({ factor }) {
  return (
    <div className="hundred-pattern">
      <strong>{factor}s pattern on a 10 × 10 grid</strong>
      <div className="hundred-grid" aria-label={`Multiples of ${factor} through 100`}>
        {Array.from({ length: 100 }, (_, index) => {
          const number = index + 1;
          return <span key={number} className={number % factor === 0 ? 'multiple' : ''}>{number}</span>;
        })}
      </div>
    </div>
  );
}

function FriendlyFactModel({ strategy }) {
  const extraLabel = strategy.action === 'subtract' ? 'Take away' : 'Add';
  return (
    <div className="friendly-fact-model">
      <div className="friendly-card base"><small>Start here</small><strong>{strategy.baseGroups} groups</strong><span>{strategy.friendlyTotal} counters</span></div>
      <div className="friendly-symbol">{strategy.action === 'subtract' ? '−' : '+'}</div>
      <div className="friendly-card adjust"><small>{extraLabel}</small><strong>{strategy.difference} group{strategy.difference === 1 ? '' : 's'}</strong><span>{strategy.adjustment} counters</span></div>
      <div className="friendly-symbol">=</div>
      <div className="friendly-card answer"><small>Altogether</small><strong>{strategy.answer}</strong><span>No crowded equation needed</span></div>
    </div>
  );
}

function MentalMoveModel({ strategy }) {
  return (
    <div className="mental-move">
      <span>🧠</span>
      <div><strong>Say the move out loud</strong><p>{strategy.tip}</p></div>
    </div>
  );
}

function ApplicationBanner({ challenge }) {
  return (
    <div className="application-banner">
      <span aria-hidden="true">🌴</span>
      <div><small>Application challenge</small><strong>{challenge.prompt}</strong><p>{challenge.context}</p></div>
    </div>
  );
}

function makeApplicationChallenge(problem) {
  if (problem.subject === 'multiplication') {
    const { a, b } = problem.parts;
    return { prompt: `${a} jungle vines each hold ${b} bananas. How many bananas are there altogether?`, context: 'Use a picture, equal groups, or a number-line jump if you need one.' };
  }
  if (problem.subject === 'addition') {
    const { a, b } = problem.parts;
    return { prompt: `Purple found ${a} Shiny Rocks and Monke found ${b} more. How many did they find altogether?`, context: 'Decide whether you are joining, separating, or comparing.' };
  }
  if (problem.subject === 'subtraction') {
    const { a, b } = problem.parts;
    return { prompt: `Monke had ${a} bananas and packed ${b} for the trail. How many remain?`, context: 'A number line can show the distance between the two amounts.' };
  }
  if (problem.subject === 'fractions') {
    return { prompt: `Two same-size fruit trays are combined. What fraction is filled altogether?`, context: 'Keep the pieces the same size, then count the filled pieces.' };
  }
  return { prompt: `The shop combines two Shiny Rock amounts. What is the new decimal total?`, context: 'Line up ones with ones and tenths with tenths.' };
}

function TeachPurpleChallenge({ problem, onComplete, onSkip }) {
  const choices = useMemo(() => getTeachChoices(problem), [problem.key]);
  const [result, setResult] = useState('');

  function choose(choice) {
    if (choice.correct) {
      setResult('Great explanation. Purple understands the idea, not just the answer.');
      onComplete(true);
    } else {
      setResult('Not quite. Look for the explanation that matches what the quantities are doing.');
    }
  }

  return (
    <div className="teach-purple">
      <div className="teach-purple-character">🐾</div>
      <p className="eyebrow">Teach Purple</p>
      <h3>Which explanation best teaches {problem.display}?</h3>
      <div className="teach-choices">
        {choices.map((choice) => <button key={choice.text} onClick={() => choose(choice)}>{choice.text}</button>)}
      </div>
      {result && <p className="teach-result" aria-live="polite">{result}</p>}
      <button className="skip-btn" onClick={onSkip}>Skip this teaching turn</button>
    </div>
  );
}

function getTeachChoices(problem) {
  const answer = problem.answer;
  if (problem.subject === 'multiplication') {
    const { a, b } = problem.parts;
    return shuffle([
      { correct: true, text: `${a} equal groups with ${b} in each group make ${answer}.` },
      { correct: false, text: `Add ${a} and ${b} because every multiplication problem is addition once.` },
      { correct: false, text: `The largest number must always be the answer.` }
    ]);
  }
  if (problem.subject === 'addition') {
    return shuffle([
      { correct: true, text: `We join both amounts to find the total, ${answer}.` },
      { correct: false, text: 'We remove the smaller amount from the larger amount.' },
      { correct: false, text: 'We count only the first amount.' }
    ]);
  }
  if (problem.subject === 'subtraction') {
    return shuffle([
      { correct: true, text: `We find what remains, or the distance between the two amounts: ${answer}.` },
      { correct: false, text: 'We join both amounts because subtraction makes a larger total.' },
      { correct: false, text: 'We ignore the second number.' }
    ]);
  }
  if (problem.subject === 'fractions') {
    return shuffle([
      { correct: true, text: `The pieces stay the same size, so we combine the top numbers and keep the denominator.` },
      { correct: false, text: 'Add both top and bottom numbers every time.' },
      { correct: false, text: 'Fractions cannot be combined.' }
    ]);
  }
  return shuffle([
    { correct: true, text: `Line up place values, combine the amounts, and keep the decimal point aligned.` },
    { correct: false, text: 'Move the decimal point to the end after adding.' },
    { correct: false, text: 'Ignore the decimal point.' }
  ]);
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function ExpeditionComplete({ profile, onRestart }) {
  return (
    <div className="expedition-complete">
      <span>🏆</span>
      <p className="eyebrow">Trail complete</p>
      <h3>You warmed up, learned, practiced, applied, and taught Purple.</h3>
      <p>That combination builds stronger knowledge than repeating the same kind of question.</p>
      <div className="completion-rewards"><b>🪨 {profile.shinyRocks}</b><b>🍌 {profile.bananas}</b><b>🔥 {profile.dailyLoginStreak || 1} day streak</b></div>
      <button className="continue-gate" onClick={onRestart}>Start another expedition</button>
    </div>
  );
}
