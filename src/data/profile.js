import { cosmetics, starterMonkes } from './maps.js';
import { defaultSkill } from '../math/adaptiveEngine.js';

export const subjects = ['addition', 'subtraction', 'multiplication', 'fractions', 'decimals'];

export const defaultProfile = {
  playerName: 'Reacher',
  profileRole: 'child',
  monkeStyle: 'jungle-monke',
  level: 1,
  rank: 'Jungle Scout',
  xp: 0,
  legendStars: 0,
  shinyRocks: 120,
  bananas: 3,
  energy: 85,
  answerStreak: 0,
  dailyLoginStreak: 0,
  bestLoginStreak: 0,
  lastLoginDate: null,
  correct: 0,
  total: 0,
  weakFacts: [],
  ownedCosmetics: [],
  equippedCosmetic: null,
  equippedCosmetics: {
    monkeHead: null,
    monkeFace: null,
    monkeBack: null,
    monkeTrail: null,
    dogNeck: null
  },
  abilities: [],
  worldProgress: {
    waterfall: {
      gates: 0,
      expeditions: 0,
      bossComplete: false,
      completedAt: null
    },
    crystalForest: {
      unlocked: false,
      gates: 0,
      bossComplete: false
    }
  },
  strategyPreferences: {},
  daily: {},
  activityLog: [],
  settings: {
    readQuestions: false,
    readHints: false,
    monkeEncouragement: false
  },
  skills: Object.fromEntries(subjects.map((subject) => [subject, defaultSkill()]))
};

function legacySlot(itemId) {
  return cosmetics.find((item) => item.id === itemId)?.slot || null;
}

export function getRank(level = 1) {
  if (level >= 20) return 'Jungle Legend';
  if (level >= 15) return 'Jungle Champion';
  if (level >= 10) return 'Canopy Explorer';
  if (level >= 5) return 'Vine Climber';
  return 'Jungle Scout';
}

export function mergeProfile(saved = {}) {
  const merged = { ...defaultProfile, ...(saved || {}) };
  if (!starterMonkes.some((item) => item.id === merged.monkeStyle)) merged.monkeStyle = 'jungle-monke';
  merged.settings = { ...defaultProfile.settings, ...(saved?.settings || {}) };
  merged.equippedCosmetics = { ...defaultProfile.equippedCosmetics, ...(saved?.equippedCosmetics || {}) };
  merged.strategyPreferences = { ...defaultProfile.strategyPreferences, ...(saved?.strategyPreferences || {}) };
  merged.worldProgress = {
    waterfall: { ...defaultProfile.worldProgress.waterfall, ...(saved?.worldProgress?.waterfall || {}) },
    crystalForest: { ...defaultProfile.worldProgress.crystalForest, ...(saved?.worldProgress?.crystalForest || {}) }
  };
  merged.abilities = [...new Set(saved?.abilities || [])];

  if (!saved?.worldProgress && saved?.total) {
    merged.worldProgress.waterfall.gates = Math.min(9, Math.floor(saved.total / 10));
    merged.worldProgress.waterfall.expeditions = merged.worldProgress.waterfall.gates;
  }

  if (saved?.equippedCosmetic) {
    const slot = legacySlot(saved.equippedCosmetic);
    if (slot && !merged.equippedCosmetics[slot]) merged.equippedCosmetics[slot] = saved.equippedCosmetic;
  }

  merged.skills = { ...defaultProfile.skills, ...(saved?.skills || {}) };
  subjects.forEach((subject) => {
    merged.skills[subject] = { ...defaultSkill(), ...(merged.skills[subject] || {}) };
    merged.skills[subject].masteryDimensions = {
      ...defaultSkill().masteryDimensions,
      ...(merged.skills[subject].masteryDimensions || {})
    };
  });
  merged.rank = getRank(merged.level);
  return merged;
}

export function makeNewProfile({ nickname, role = 'child', monkeStyle = 'jungle-monke' } = {}) {
  return mergeProfile({
    ...defaultProfile,
    playerName: nickname || (role === 'adult' ? 'Parent Player' : 'Explorer'),
    profileRole: role,
    monkeStyle,
    shinyRocks: 120,
    bananas: 3,
    energy: 100
  });
}

export function resetLearningProgress(profile) {
  const fresh = makeNewProfile({
    nickname: profile.playerName,
    role: profile.profileRole,
    monkeStyle: profile.monkeStyle
  });
  return mergeProfile({
    ...fresh,
    ownedCosmetics: profile.ownedCosmetics || [],
    equippedCosmetics: profile.equippedCosmetics || {},
    equippedCosmetic: profile.equippedCosmetic || null,
    settings: profile.settings || {},
    shinyRocks: profile.shinyRocks || 0,
    bananas: profile.bananas || 0
  });
}

export function awardGuidedExpedition(profile) {
  const current = mergeProfile(profile);
  if (current.worldProgress.waterfall.bossComplete) {
    return {
      ...current,
      worldProgress: {
        ...current.worldProgress,
        crystalForest: {
          ...current.worldProgress.crystalForest,
          gates: Math.min(10, (current.worldProgress.crystalForest.gates || 0) + 1)
        }
      }
    };
  }
  const gates = Math.min(10, (current.worldProgress.waterfall.gates || 0) + 1);
  return {
    ...current,
    worldProgress: {
      ...current.worldProgress,
      waterfall: {
        ...current.worldProgress.waterfall,
        gates,
        expeditions: (current.worldProgress.waterfall.expeditions || 0) + 1
      }
    }
  };
}

export function bossReadiness(profile) {
  const dimensions = Object.values(profile.skills || {}).reduce((total, skill) => {
    const values = skill?.masteryDimensions || {};
    Object.keys(total).forEach((key) => { total[key] += values[key] || 0; });
    return total;
  }, { recall: 0, visual: 0, application: 0, explanation: 0, retention: 0 });

  return {
    gates: (profile.worldProgress?.waterfall?.gates || 0) >= 10,
    recall: dimensions.recall >= 3,
    visual: dimensions.visual >= 1,
    application: dimensions.application >= 1,
    explanation: dimensions.explanation >= 1,
    retention: dimensions.retention >= 1
  };
}

export function completeWaterfallWorld(profile) {
  const current = mergeProfile(profile);
  const owned = new Set(current.ownedCosmetics || []);
  owned.add('trail-backpack');
  return mergeProfile({
    ...current,
    ownedCosmetics: [...owned],
    equippedCosmetics: { ...current.equippedCosmetics, monkeBack: 'trail-backpack', monkeTrail: 'waterfall-dash' },
    abilities: [...new Set([...(current.abilities || []), 'waterfall-dash'])],
    worldProgress: {
      ...current.worldProgress,
      waterfall: {
        ...current.worldProgress.waterfall,
        gates: 10,
        bossComplete: true,
        completedAt: new Date().toISOString()
      },
      crystalForest: {
        ...current.worldProgress.crystalForest,
        unlocked: true
      }
    },
    shinyRocks: (current.shinyRocks || 0) + 250
  });
}
