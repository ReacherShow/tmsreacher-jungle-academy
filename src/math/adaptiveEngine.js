const OPS = ['addition', 'subtraction', 'multiplication', 'fractions', 'decimals'];

export function createProblem(profile, subject = 'multiplication', forceReview = false) {
  const skill = profile.skills?.[subject] || defaultSkill();
  if ((forceReview || Math.random() < 0.35) && skill.reviewQueue?.length) {
    return fromReview(skill.reviewQueue[Math.floor(Math.random() * skill.reviewQueue.length)], subject);
  }
  switch (subject) {
    case 'addition': return makeAddition(skill.level);
    case 'subtraction': return makeSubtraction(skill.level);
    case 'fractions': return makeFraction(skill.level);
    case 'decimals': return makeDecimal(skill.level);
    default: return makeMultiplication(skill, profile);
  }
}

export function defaultSkill() {
  return { level: 1, correct: 0, total: 0, streak: 0, mastery: {}, misses: {}, reviewQueue: [], lastFive: [] };
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function choice(list) { return list[Math.floor(Math.random() * list.length)]; }

function makeMultiplication(skill, profile) {
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
  const answer = Number((a + b).toFixed(level <= 1 ? 1 : 2));
  return { subject: 'decimals', display: `${a.toFixed(level <= 1 ? 1 : 2)} + ${b.toFixed(level <= 1 ? 1 : 2)}`, answer, key: `${a}+${b}`, parts: { a, b, places }, type: 'decimal' };
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
  skills[problem.subject] = {
    ...oldSkill,
    level,
    correct: oldSkill.correct + (wasCorrect ? 1 : 0),
    total: oldSkill.total + 1,
    streak: wasCorrect ? oldSkill.streak + 1 : 0,
    mastery: { ...oldSkill.mastery, [problem.key]: nextMastery },
    misses: { ...oldSkill.misses, [problem.key]: wasCorrect ? Math.max(0, missCount - 1) : missCount + 1 },
    reviewQueue,
    lastFive
  };

  const daily = { ...(profile.daily || {}) };
  const day = { correct: 0, total: 0, xp: 0, rocks: 0, bananas: 0, subjects: {}, ...(daily[today] || {}) };
  const xpGain = wasCorrect ? (mode === 'flashcards' ? 8 : 15) : 4;
  const rocksGain = wasCorrect ? (mode === 'flashcards' ? 4 : 8) : 1;
  const bananasGain = wasCorrect && mode !== 'flashcards' ? 1 : 0;
  day.correct += wasCorrect ? 1 : 0;
  day.total += 1;
  day.xp += xpGain;
  day.rocks += rocksGain;
  day.bananas += bananasGain;
  day.subjects[problem.subject] = (day.subjects[problem.subject] || 0) + 1;
  daily[today] = day;

  const activityLog = [...(profile.activityLog || []), { date: new Date().toISOString(), subject: problem.subject, key: problem.key, correct: wasCorrect, mode }].slice(-1000);
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
  const subject = problem.subject;
  if (subject === 'multiplication') return multiplicationHint(problem);
  if (subject === 'addition') return additionHint(problem);
  if (subject === 'subtraction') return subtractionHint(problem);
  if (subject === 'fractions') return fractionHint(problem);
  return decimalHint(problem);
}

function multiplicationHint(problem) {
  const { a, b } = problem.parts;
  const smaller = Math.min(a, b), larger = Math.max(a, b), answer = problem.answer;
  let tip = `Think of ${a} × ${b} as ${a} groups of ${b}. Skip-count by ${b}: ${Array.from({ length: Math.min(a, 8) }, (_, i) => b * (i + 1)).join(', ')}${a > 8 ? '...' : ''}`;
  if (smaller === 9) tip = `9s trick: ${larger} × 10 = ${larger * 10}, then subtract ${larger}. ${larger * 10} − ${larger} = ${answer}.`;
  else if (smaller === 8) tip = `Double three times: ${larger} → ${larger * 2} → ${larger * 4} → ${answer}.`;
  else if (smaller === 6) tip = `Use 5s plus one more group: ${larger} × 5 = ${larger * 5}, plus ${larger} = ${answer}.`;
  else if (smaller === 4) tip = `Double twice: ${larger} doubled is ${larger * 2}; doubled again is ${answer}.`;
  return { tip, model: 'groups', groups: Array.from({ length: a }, (_, i) => ({ id: i, count: b })) };
}
function additionHint(problem) {
  const { a, b } = problem.parts;
  const makeTen = Math.ceil(a / 10) * 10;
  const need = makeTen - a;
  const tip = need > 0 && need < b ? `Bridge to ten: ${a} needs ${need} to reach ${makeTen}. Split ${b} into ${need} and ${b - need}. Then ${makeTen} + ${b - need} = ${problem.answer}.` : `Break apart place values: add tens first, then ones. ${a} + ${b} = ${problem.answer}.`;
  return { tip, model: 'bar', bars: [a, b] };
}
function subtractionHint(problem) {
  const { a, b } = problem.parts;
  return { tip: `Count up from ${b} to ${a}. The distance between them is the answer: ${problem.answer}.`, model: 'numberline', start: b, end: a };
}
function fractionHint(problem) {
  const { n1, n2, den } = problem.parts;
  return { tip: `Same denominator means same-size pieces. Add the top numbers: ${n1} + ${n2} = ${n1 + n2}. Keep the bottom number ${den}.`, model: 'fractions', parts: [n1, n2], den };
}
function decimalHint(problem) {
  const { a, b } = problem.parts;
  return { tip: `Line up the decimal points, then add like whole numbers. ${a} + ${b} = ${problem.answer}.`, model: 'decimal', bars: [a, b] };
}

export function needsReview(profile, subject) {
  if (subject) return ((profile.skills?.[subject]?.reviewQueue) || []).length >= 3;
  return OPS.some((op) => ((profile.skills?.[op]?.reviewQueue) || []).length >= 3);
}
export function accuracy(profileOrSkill) {
  const total = profileOrSkill.total || 0;
  if (!total) return 0;
  return Math.round(((profileOrSkill.correct || 0) / total) * 100);
}
export function subjectAccuracy(profile, subject) { return accuracy(profile.skills?.[subject] || defaultSkill()); }
export function todayKey() { return new Date().toISOString().slice(0, 10); }
function dateOffsetKey(offset) { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); }
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
