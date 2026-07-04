export const maps = [
  { id: 'treehouse', name: 'Waterfall Treehouse', status: 'Unlocked', skill: 'Mixed multiplication', emoji: '🌊', theme: 'waterfall', level: 1 },
  { id: 'jungle', name: 'Jungle Trail', status: 'Unlock at Level 2', skill: 'Fast facts', emoji: '🌴', theme: 'jungle', level: 2 },
  { id: 'temple', name: 'Monkey Temple', status: 'Unlock at Level 4', skill: 'Division gates', emoji: '🛕', theme: 'temple', level: 4 },
  { id: 'volcano', name: 'Volcano Vines', status: 'Unlock at Level 6', skill: 'Hard mixed facts', emoji: '🌋', theme: 'volcano', level: 6 },
  { id: 'crystal', name: 'Crystal Cavern', status: 'Unlock at Level 7', skill: 'Fractions', emoji: '💎', theme: 'crystal', level: 7 },
  { id: 'space', name: 'Space Canopy', status: 'Coming later', skill: 'Decimals and algebra', emoji: '🚀', theme: 'space', level: 10 }
];

export const cosmetics = [
  { id: 'crown', name: 'Purple Crown', cost: 200, emoji: '👑', description: 'A royal Monke flex.', slot: 'monkeHead', type: 'monke' },
  { id: 'crystal-pack', name: 'Crystal Backpack', cost: 500, emoji: '💎', description: 'Carry shiny loot.', slot: 'monkeBack', type: 'monke' },

  // Keep the original id so existing purchases automatically become the redesigned starter bandana.
  { id: 'dog-bandana', name: 'Jungle Leaf Bandana', cost: 150, emoji: '🌿', description: 'A fresh leaf-green starter style.', slot: 'dogNeck', type: 'bandana', bandanaStyle: 'leaf', tier: 'Trail Gear' },
  { id: 'dog-bandana-waterfall', name: 'Waterfall Wave Bandana', cost: 300, emoji: '🌊', description: 'Blue waves with a bright foam edge.', slot: 'dogNeck', type: 'bandana', bandanaStyle: 'waterfall', tier: 'Explorer Gear' },
  { id: 'dog-bandana-crystal', name: 'Crystal Spark Bandana', cost: 500, emoji: '💎', description: 'Purple crystal facets that shimmer.', slot: 'dogNeck', type: 'bandana', bandanaStyle: 'crystal', tier: 'Champion Gear' },
  { id: 'dog-bandana-legend', name: 'Golden Legend Bandana', cost: 800, emoji: '⭐', description: 'Gold trim and a Jungle Legend star.', slot: 'dogNeck', type: 'bandana', bandanaStyle: 'legend', tier: 'Legend Gear' }
];
