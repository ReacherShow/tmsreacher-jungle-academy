const OPS = ['addition', 'subtraction', 'multiplication', 'fractions', 'decimals'];
const REVIEW_INTERVALS = [0, 1, 3, 7, 14, 30];

export function createProblem(profile, subject = 'multiplication', forceReview = false) {
  const skill = profile.skills?.[subject] || defaultSkill();
  const dueReviews = getDueReviewKeys(skill);
  const reviewPool = dueReviews.length ? dueReviews : (skill.reviewQueue || []);

  if ((forceReview || Math.random() < 0.35) && reviewPool.length) {
    return fromReview(choice(reviewPool), subject);
  }

  switch (subject) {
    case 'addition': return makeAddition(skill.level);
    case 'subtraction': return makeSubtraction(skill.level);
    case 'fractions': return makeFraction(skill.level);
    case 'decimals': return makeDecimal(skill.level);
    default: return makeMultiplication(skill);
  }
}

export function defaultSkill() {
  return {
    level: 1,
    correct: 0,
    total: 0,
    streak: 0,
    mastery: {},
    misses: {},
    reviewQueue: [],
    reviewSchedule: {},
    lastFive: [],
    skips: 0,
    masteryDimensions: {
      recall: 0,
      visual: 0,
      application: 0,
      explanation: 0,
      retention: 0
    }
  };
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function choice(list) { return list[Math.floor(Math.random() * list.length)]; }

function makeMultiplication(skill) {
  const cap = getSubjectRange('multiplication', skill).max;
  const facts = [];
  for (let a = 2; a <= cap; a++) {
    for (let b = 2; b <= cap; b++) {
      const key = `${a}x${b}`;
      const mastery = skill.mastery[key] ?? 0;
      const misses = skill.misses[key] ?? 0;
      const weight = Math.max(1, 11 - mastery + misses * 3);
      for (let i = 0; i < weight; i++) facts.push([a, b]);
    }
  }
  const [a, b] = choice(facts);
  return { subject: 'multiplication', display: `${a} × ${b}`, answer: a * b, key: `${a}x${b}`, parts: { a, b }, type: 'whole' };
}

function makeAddition(level) {
  const max = level <= 1 ? 20 : level === 2 ? 100 : 999;
  const a = rand(level <= 2 ? 1 : 100, max);
  const b = rand(1, level <= 1 ? 20 : level === 2 ? 60 : 400);
  return { subject: 'addition', display: `${a} + ${b}`, answer: a + b, key: `${a}+${b}`, parts: { a, b }, type: 'whole' };
}

function makeSubtraction(level) {
  const max = level <= 1 ? 30 : level === 2 ? 120 : 999;
  const a = rand(level <= 2 ? 10 : 100, max);
  const b = rand(1, Math.min(a, level <= 1 ? 20 : level === 2 ? 80 : 450));
  return { subject: 'subtraction', display: `${a} − ${b}`, answer: a - b, key: `${a}-${b}`, parts: { a, b }, type: 'whole' };
}

function makeFraction(level) {
  const denominators = level <= 1 ? [2, 3, 4, 6, 8] : [3, 4, 5, 6, 8, 10, 12];
  const den = choice(denominators);
  const n1 = rand(1, den - 1);
  const n2 = rand(1, den - n1);
  const answer = `${n1 + n2}/${den}`;
  return { subject: 'fractions', display: `${n1}/${den} + ${n2}/${den}`, answer, key: `${n1}/${den}+${n2}/${den}`, parts: { n1, n2, den }, type: 'fraction' };
}

function makeDecimal(level) {
  const places = level <= 1 ? 10 : 100;
  const a = rand(1, level <= 1 ? 90 : 900) / places;
  const b = rand(1, level <= 1 ? 90 : 900) / places;
  const digits = level <= 1 ? 1 : 2;
  const answer = Number((a + b).toFixed(digits));
  return { subject: 'decimals', display: `${a.toFixed(digits)} + ${b.toFixed(digits)}`, answer, key: `${a}+${b}`, parts: { a, b, places }, type: 'decimal' };
}

function fromReview(key, subject) {
  if (subject === 'multiplication' && key.includes('x')) {
    const [a, b] = key.split('x').map(Number);
    return { subject, display: `${a} × ${b}`, answer: a * b, key, parts: { a, b }, type: 'whole' };
  }
  if (subject === 'addition' && key.includes('+') && !key.includes('/')) {
    const [a, b] = key.split('+').map(Number);
    return { subject, display: `${a} + ${b}`, answer: a + b, key, parts: { a, b }, type: 'whole' };
  }
  if (subject === 'subtraction' && key.includes('-')) {
    const [a, b] = key.split('-').map(Number);
    return { subject, display: `${a} − ${b}`, answer: a - b, key, parts: { a, b }, type: 'whole' };
  }
  if (subject === 'fractions' && key.includes('/')) {
    const match = key.match(/(\d+)\/(\d+)\+(\d+)\/(\d+)/);
    if (match) {
      const [, n1, den, n2] = match.map(Number);
      return { subject, display: `${n1}/${den} + ${n2}/${den}`, answer: `${n1 + n2}/${den}`, key, parts: { n1, n2, den }, type: 'fraction' };
    }
  }
  if (subject === 'decimals' && key.includes('+')) {
    const [a, b] = key.split('+').map(Number);
    const answer = Number((a + b).toFixed(2));
    return { subject, display: `${a} + ${b}`, answer, key, parts: { a, b, places: 100 }, type: 'decimal' };
  }
  return createProblem({ skills: { [subject]: { ...defaultSkill(), reviewQueue: [] } } }, subject, false);
}

export function normalizeAnswer(value, problem) {
  const clean = String(value).trim();
  if (problem.type === 'fraction') return clean.replace(/\s/g, '');
  if (problem.type === 'decimal') return Number(clean);
  return Number(clean);
}

export function isCorrectAnswer(value, problem) {
  const normalized = normalizeAnswer(value, problem);
  if (problem.type === 'fraction') return normalized === problem.answer;
  if (problem.type === 'decimal') return Math.abs(normalized - problem.answer) < 0.001;
  return normalized === problem.answer;
}

export function updateProfile(profile, problem, wasCorrect, mode = 'practice') {
  const today = todayKey();
  const skills = { ...(profile.skills || {}) };
  const oldSkill = { ...defaultSkill(), ...(skills[problem.subject] || {}) };
  const current = oldSkill.mastery[problem.key] ?? 0;
  const missCount = oldSkill.misses[problem.key] ?? 0;
  const nextMastery = Math.max(0, Math.min(12, current + (wasCorrect ? 1 : -2)));
  const lastFive = [...(oldSkill.lastFive || []), wasCorrect].slice(-5);
  const recentAcc = lastFive.length ? lastFive.filter(Boolean).length / lastFive.length : 0;
  let level = oldSkill.level;
  if (oldSkill.total >= 5 && recentAcc >= 0.8 && level < 5) level += 1;
  if (lastFive.length >= 4 && recentAcc <= 0.4 && level > 1) level -= 1;

  const reviewQueue = wasCorrect
    ? (oldSkill.reviewQueue || []).filter((fact) => fact !== problem.key || nextMastery < 4)
    : [...new Set([problem.key, ...(oldSkill.reviewQueue || [])])].slice(0, 18);

  const previousReview = oldSkill.reviewSchedule?.[problem.key] || { stage: 0, due: today };
  const nextStage = wasCorrect ? Math.min(REVIEW_INTERVALS.length - 1, (previousReview.stage || 0) + 1) : 0;
  const due = wasCorrect ? dateOffsetKey(REVIEW_INTERVALS[nextStage]) : today;
  const reviewSchedule = {
    ...(oldSkill.reviewSchedule || {}),
    [problem.key]: {
      stage: nextStage,
      due,
      lastResult: wasCorrect ? 'correct' : 'review',
      lastSeen: new Date().toISOString()
    }
  };

  const dimensions = { ...defaultSkill().masteryDimensions, ...(oldSkill.masteryDimensions || {}) };
  if (wasCorrect) {
    if (mode === 'guided-retry') dimensions.visual += 1;
    else if (mode === 'application') dimensions.application += 1;
    else if (mode === 'teach-purple') dimensions.explanation += 1;
    else if (mode === 'review') dimensions.retention += 1;
    else dimensions.recall += 1;
  }

  skills[problem.subject] = {
    ...oldSkill,
    level,
    correct: oldSkill.correct + (wasCorrect ? 1 : 0),
    total: oldSkill.total + 1,
    streak: wasCorrect ? oldSkill.streak + 1 : 0,
    mastery: { ...oldSkill.mastery, [problem.key]: nextMastery },
    misses: { ...oldSkill.misses, [problem.key]: wasCorrect ? Math.max(0, missCount - 1) : missCount + 1 },
    reviewQueue,
    reviewSchedule,
    lastFive,
    masteryDimensions: dimensions
  };

  const daily = { ...(profile.daily || {}) };
  const day = { correct: 0, total: 0, xp: 0, rocks: 0, bananas: 0, subjects: {}, ...(daily[today] || {}) };
  const guidedRetry = mode === 'guided-retry';
  const flashcards = mode === 'flashcards';
  const xpGain = wasCorrect ? (guidedRetry ? 6 : flashcards ? 8 : 15) : 4;
  const rocksGain = wasCorrect ? (guidedRetry ? 2 : flashcards ? 4 : 8) : 1;
  const bananasGain = wasCorrect && !flashcards && !guidedRetry ? 1 : 0;
  day.correct += wasCorrect ? 1 : 0;
  day.total += 1;
  day.xp += xpGain;
  day.rocks += rocksGain;
  day.bananas += bananasGain;
  day.subjects[problem.subject] = (day.subjects[problem.subject] || 0) + 1;
  daily[today] = day;

  const activityLog = [...(profile.activityLog || []), {
    date: new Date().toISOString(),
    localDate: today,
    subject: problem.subject,
    key: problem.key,
    correct: wasCorrect,
    mode
  }].slice(-1000);
  const totalCorrect = (profile.correct || 0) + (wasCorrect ? 1 : 0);
  const total = (profile.total || 0) + 1;
  const nextXp = (profile.xp || 0) + xpGain;

  return {
    ...profile,
    skills,
    xp: nextXp,
    level: Math.floor(nextXp / 175) + 1,
    shinyRocks: (profile.shinyRocks || 0) + rocksGain,
    bananas: (profile.bananas || 0) + bananasGain,
    energy: Math.max(0, Math.min(100, (profile.energy || 100) + (wasCorrect ? 2 : -3))),
    answerStreak: wasCorrect ? (profile.answerStreak || 0) + 1 : 0,
    correct: totalCorrect,
    total,
    daily,
    activityLog,
    weakFacts: summarizeWeakFacts(skills).slice(0, 10)
  };
}

export function recordSkip(profile, problem) {
  const today = todayKey();
  const skills = { ...(profile.skills || {}) };
  const oldSkill = { ...defaultSkill(), ...(skills[problem.subject] || {}) };
  const reviewQueue = [...new Set([problem.key, ...(oldSkill.reviewQueue || [])])].slice(0, 18);
  const reviewSchedule = {
    ...(oldSkill.reviewSchedule || {}),
    [problem.key]: {
      stage: 0,
      due: today,
      lastResult: 'skipped',
      lastSeen: new Date().toISOString()
    }
  };
  skills[problem.subject] = {
    ...oldSkill,
    skips: (oldSkill.skips || 0) + 1,
    reviewQueue,
    reviewSchedule
  };
  const activityLog = [...(profile.activityLog || []), {
    date: new Date().toISOString(),
    localDate: today,
    subject: problem.subject,
    key: problem.key,
    correct: false,
    mode: 'skip'
  }].slice(-1000);
  return { ...profile, skills, activityLog };
}

export function recordStrategyPreference(profile, strategyId) {
  const strategyPreferences = { ...(profile.strategyPreferences || {}) };
  strategyPreferences[strategyId] = (strategyPreferences[strategyId] || 0) + 1;
  return { ...profile, strategyPreferences };
}

export function updateLoginStreak(profile) {
  const today = todayKey();
  const last = profile.lastLoginDate;
  if (last === today) return profile;
  const yesterday = dateOffsetKey(-1);
  const streak = last === yesterday ? (profile.dailyLoginStreak || 0) + 1 : 1;
  const dailyRewards = { ...(profile.dailyRewards || {}), [today]: true };
  const rewardRocks = 25 + Math.min(streak * 5, 75);
  return { ...profile, lastLoginDate: today, dailyLoginStreak: streak, bestLoginStreak: Math.max(profile.bestLoginStreak || 0, streak), dailyRewards, shinyRocks: (profile.shinyRocks || 0) + rewardRocks };
}

export function getSubjectRange(subject, skill = defaultSkill()) {
  if (subject === 'addition') return { min: 0, max: skill.level <= 1 ? 20 : skill.level === 2 ? 100 : skill.level === 3 ? 999 : 9999, label: skill.level <= 1 ? 'Friendly sums' : skill.level === 2 ? 'Two-digit sums' : 'Bigger sums' };
  if (subject === 'subtraction') return { min: 0, max: skill.level <= 1 ? 30 : skill.level === 2 ? 120 : 999, label: skill.level <= 1 ? 'No-regroup warmup' : skill.level === 2 ? 'Two-digit takeaways' : 'Regrouping climb' };
  if (subject === 'fractions') return { min: 2, max: skill.level <= 2 ? 8 : 12, label: skill.level <= 2 ? 'Same denominator' : 'Fraction builder' };
  if (subject === 'decimals') return { min: 0, max: skill.level <= 1 ? 9.9 : 99.99, label: skill.level <= 1 ? 'Tenths' : 'Hundredths' };
  return { min: 2, max: skill.level <= 1 ? 5 : skill.level === 2 ? 7 : skill.level === 3 ? 9 : 12, label: skill.level <= 1 ? 'Confidence facts' : skill.level === 2 ? 'Steady facts' : skill.level === 3 ? 'Canopy facts' : 'Full table' };
}

export function getHint(problem) {
  return getLearningStrategies(problem)[0];
}

export function getLearningStrategies(problem) {
  if (problem.subject === 'multiplication') return multiplicationStrategies(problem);
  if (problem.subject === 'addition') return additionStrategies(problem);
  if (problem.subject === 'subtraction') return subtractionStrategies(problem);
  if (problem.subject === 'fractions') return fractionStrategies(problem);
  return decimalStrategies(problem);
}

function multiplicationStrategies(problem) {
  const { a, b } = problem.parts;
  const smaller = Math.min(a, b);
  const larger = Math.max(a, b);
  const answer = problem.answer;
  const sequence = Array.from({ length: a }, (_, i) => b * (i + 1));

  let friendlyBase = 5;
  let friendlyAction = 'add';
  if (a >= 8) {
    friendlyBase = 10;
    friendlyAction = 'subtract';
  } else if (a < 5) {
    friendlyBase = Math.max(2, a - 1);
    friendlyAction = 'add';
  }
  const difference = Math.abs(a - friendlyBase);
  const friendlyTotal = friendlyBase * b;
  const adjustment = difference * b;

  let mentalTip = `Picture ${a} equal groups with ${b} in every group.`;
  if (smaller === 9) mentalTip = `Use 10 groups, then take away one group of ${larger}.`;
  else if (smaller === 8) mentalTip = `Double ${larger}, double again, then double one more time.`;
  else if (smaller === 6) mentalTip = `Find 5 groups of ${larger}, then add one more group.`;
  else if (smaller === 4) mentalTip = `Double ${larger}, then double the result.`;
  else if (smaller === 5) mentalTip = `Count by fives. Every answer ends in 0 or 5.`;
  else if (smaller === 2) mentalTip = `Multiplying by 2 means doubling.`;

  return [
    {
      id: 'picture-groups',
      label: 'Build equal groups',
      icon: '🧺',
      cpa: 'Concrete',
      tip: `Make ${a} groups. Put ${b} counters in every group, then count the total.`,
      model: 'groups',
      groups: Array.from({ length: a }, (_, i) => ({ id: i, count: b }))
    },
    {
      id: 'number-line-jumps',
      label: 'Jump the number line',
      icon: '🦍',
      cpa: 'Pictorial',
      tip: `Start at 0. Make ${a} equal jumps of ${b}. Your last landing spot is the product.`,
      model: 'repeated-jumps',
      start: 0,
      step: b,
      jumps: a,
      sequence
    },
    {
      id: 'array-grid',
      label: 'See the array',
      icon: '▦',
      cpa: 'Pictorial',
      tip: `${a} rows with ${b} squares in each row show the multiplication fact as one rectangle.`,
      model: 'array-grid',
      rows: a,
      cols: b,
      patternFactor: [2, 5, 10].includes(smaller) ? smaller : null
    },
    {
      id: 'friendly-fact',
      label: friendlyBase === 5 ? 'Start with 5 groups' : friendlyBase === 10 ? 'Start with 10 groups' : 'Start with an easier group',
      icon: '🌿',
      cpa: 'Concrete → Abstract',
      tip: friendlyAction === 'subtract'
        ? `Build ${friendlyBase} groups first, then remove ${difference} group${difference === 1 ? '' : 's'}.`
        : `Build ${friendlyBase} groups first, then add ${difference} more group${difference === 1 ? '' : 's'}.`,
      model: 'friendly-fact',
      groups: a,
      groupSize: b,
      baseGroups: friendlyBase,
      difference,
      action: friendlyAction,
      friendlyTotal,
      adjustment,
      answer
    },
    {
      id: 'mental-shortcut',
      label: 'Monke mental move',
      icon: '💡',
      cpa: 'Abstract',
      tip: mentalTip,
      model: 'mental-move',
      equation: [`${a} × ${b}`, `${answer}`]
    }
  ];
}

function additionStrategies(problem) {
  const { a, b } = problem.parts;
  const makeTen = Math.ceil(a / 10) * 10;
  const need = makeTen - a;
  return [
    {
      id: 'bridge-ten',
      label: 'Bridge to ten',
      tip: need > 0 && need < b
        ? `${a} needs ${need} to reach ${makeTen}. Split ${b} into ${need} and ${b - need}. Then ${makeTen} + ${b - need} = ${problem.answer}.`
        : `Add the tens, then add the ones.`,
      model: 'bar',
      bars: [a, b]
    },
    {
      id: 'place-value',
      label: 'Place value',
      tip: `Break both numbers into tens and ones, combine matching places, then put them back together.`,
      model: 'equation',
      equation: [`${a} + ${b}`, `${problem.answer}`]
    }
  ];
}

function subtractionStrategies(problem) {
  const { a, b } = problem.parts;
  return [
    { id: 'count-up', label: 'Count up', tip: `Start at ${b} and count up to ${a}. The distance is ${problem.answer}.`, model: 'numberline', start: b, end: a },
    { id: 'subtract-parts', label: 'Break it apart', tip: `Subtract the tens first, then the ones. Check by adding ${b} back to your answer.`, model: 'equation', equation: [`${a} − ${b}`, `${problem.answer}`, `${problem.answer} + ${b} = ${a}`] }
  ];
}

function fractionStrategies(problem) {
  const { n1, n2, den } = problem.parts;
  return [
    { id: 'fraction-picture', label: 'See the pieces', tip: `The pieces are the same size because the denominator stays ${den}. Combine ${n1} pieces and ${n2} pieces.`, model: 'fractions', parts: [n1, n2], den },
    { id: 'fraction-rule', label: 'Use the structure', tip: `Add the top numbers: ${n1} + ${n2} = ${n1 + n2}. Keep the bottom number ${den}.`, model: 'equation', equation: [`${n1}/${den} + ${n2}/${den}`, `${n1 + n2}/${den}`] }
  ];
}

function decimalStrategies(problem) {
  const { a, b } = problem.parts;
  return [
    { id: 'decimal-grid', label: 'See tenths', tip: `Line up the decimal points so tenths stay with tenths and ones stay with ones.`, model: 'decimal', bars: [a, b] },
    { id: 'decimal-money', label: 'Think money', tip: `Imagine ${a} and ${b} as dollars. Combine the whole dollars and decimal parts separately.`, model: 'equation', equation: [`${a} + ${b}`, `${problem.answer}`] }
  ];
}

export function needsReview(profile, subject) {
  if (subject) return getDueReviewKeys(profile.skills?.[subject] || defaultSkill()).length > 0 || ((profile.skills?.[subject]?.reviewQueue) || []).length >= 3;
  return OPS.some((op) => needsReview(profile, op));
}

export function getDueReviewKeys(skill = defaultSkill()) {
  const today = todayKey();
  return Object.entries(skill.reviewSchedule || {})
    .filter(([, item]) => item?.due && item.due <= today)
    .sort((a, b) => String(a[1].due).localeCompare(String(b[1].due)))
    .map(([key]) => key);
}

export function accuracy(profileOrSkill) {
  const total = profileOrSkill.total || 0;
  if (!total) return 0;
  return Math.round(((profileOrSkill.correct || 0) / total) * 100);
}

export function subjectAccuracy(profile, subject) { return accuracy(profile.skills?.[subject] || defaultSkill()); }

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayKey() { return localDateKey(new Date()); }

function dateOffsetKey(offset) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return localDateKey(date);
}

export function formatDateLabel(key, includeYear = false) {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', ...(includeYear ? { year: 'numeric' } : {}) }).format(date);
}

export function summarizeWeakFacts(skills) {
  return Object.entries(skills || {}).flatMap(([subject, skill]) => Object.entries(skill.misses || {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([key]) => `${subject}: ${key}`));
}

export function getHistory(profile, days = 7) {
  return Array.from({ length: days }, (_, idx) => {
    const offset = idx - days + 1;
    const key = dateOffsetKey(offset);
    const day = profile.daily?.[key] || { correct: 0, total: 0, xp: 0 };
    return { date: key, ...day, accuracy: day.total ? Math.round((day.correct / day.total) * 100) : 0 };
  });
}
