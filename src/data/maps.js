export const starterMonkes = [
  {
    id: 'jungle-monke',
    name: 'Jungle Monke',
    description: 'Classic purple fur with leaf-green trail marks.',
    fur: '#7b2fe4',
    face: '#b987ff',
    accent: '#4de27a'
  },
  {
    id: 'waterfall-monke',
    name: 'Waterfall Monke',
    description: 'Blue-violet fur with bright water accents.',
    fur: '#5b4de7',
    face: '#a9d8ff',
    accent: '#64e9ff'
  },
  {
    id: 'crystal-monke',
    name: 'Crystal Monke',
    description: 'Deep violet fur with glowing crystal markings.',
    fur: '#4b187f',
    face: '#d2a7ff',
    accent: '#8cf5ff'
  },
  {
    id: 'sunset-monke',
    name: 'Sunset Monke',
    description: 'Magenta fur with warm orange adventure marks.',
    fur: '#bd2da7',
    face: '#ffc0e8',
    accent: '#ffad55'
  }
];

export const maps = [
  { id: 'treehouse', name: 'Waterfall Treehouse', status: 'Current world', skill: 'Build multiplication confidence', emoji: '🌊', theme: 'waterfall', level: 1 },
  { id: 'crystal-forest', name: 'Crystal Forest', status: 'Open the giant door', skill: 'Patterns, fractions, and flexible thinking', emoji: '💎', theme: 'crystal', level: 2 },
  { id: 'monkey-temple', name: 'Monkey Temple', status: 'Coming after Crystal Forest', skill: 'Division gates', emoji: '🛕', theme: 'temple', level: 4 },
  { id: 'volcano-vines', name: 'Volcano Vines', status: 'Future world', skill: 'Mixed challenges', emoji: '🌋', theme: 'volcano', level: 6 },
  { id: 'space-canopy', name: 'Space Canopy', status: 'Future world', skill: 'Decimals and algebra', emoji: '🚀', theme: 'space', level: 10 }
];

export const cosmetics = [
  { id: 'crown', name: 'Purple Crown', cost: 260, emoji: '👑', description: 'A detailed crystal-trimmed crown for Monke.', slot: 'monkeHead', type: 'monke', tier: 'Rare' },
  { id: 'leaf-crown', name: 'Canopy Leaf Crown', cost: 160, emoji: '🌿', description: 'A lighter crown woven from jungle leaves.', slot: 'monkeHead', type: 'monke', tier: 'Trail' },
  { id: 'trail-backpack', name: 'Trail Backpack', cost: 0, emoji: '🎒', description: 'World One reward. Sits on Monke’s back and carries trail gear.', slot: 'monkeBack', type: 'monke', tier: 'World Reward', unlock: 'waterfall-boss' },
  { id: 'crystal-pack', name: 'Crystal Backpack', cost: 620, emoji: '💎', description: 'A rare, detailed crystal pack with glowing straps.', slot: 'monkeBack', type: 'monke', tier: 'Champion' },
  { id: 'waterfall-dash', name: 'Waterfall Dash', cost: 0, emoji: '💦', description: 'Ability trail earned by completing Waterfall Treehouse.', slot: 'monkeTrail', type: 'trail', tier: 'World Ability', unlock: 'waterfall-boss' },

  { id: 'dog-bandana', name: 'Jungle Leaf Bandana', cost: 150, emoji: '🌿', description: 'A fresh leaf-green starter style.', slot: 'dogNeck', type: 'bandana', bandanaStyle: 'leaf', tier: 'Trail Gear' },
  { id: 'dog-bandana-waterfall', name: 'Waterfall Wave Bandana', cost: 300, emoji: '🌊', description: 'Blue waves with a bright foam edge.', slot: 'dogNeck', type: 'bandana', bandanaStyle: 'waterfall', tier: 'Explorer Gear' },
  { id: 'dog-bandana-crystal', name: 'Crystal Spark Bandana', cost: 500, emoji: '💎', description: 'Purple crystal facets that shimmer.', slot: 'dogNeck', type: 'bandana', bandanaStyle: 'crystal', tier: 'Champion Gear' },
  { id: 'dog-bandana-legend', name: 'Golden Legend Bandana', cost: 800, emoji: '⭐', description: 'Gold trim and a Jungle Legend star.', slot: 'dogNeck', type: 'bandana', bandanaStyle: 'legend', tier: 'Legend Gear' }
];

export function featuredCosmeticsForWeek(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1);
  const week = Math.floor((date - start) / (7 * 24 * 60 * 60 * 1000));
  const purchasable = cosmetics.filter((item) => item.cost > 0);
  if (!purchasable.length) return [];
  return Array.from({ length: Math.min(3, purchasable.length) }, (_, index) => purchasable[(week + index * 2) % purchasable.length].id);
}
