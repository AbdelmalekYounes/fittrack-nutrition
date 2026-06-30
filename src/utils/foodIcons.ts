// Associe une icône emoji à chaque aliment, en l'absence d'API d'images payante.
// Le matching se fait par mot-clé sur l'id/le nom afin de couvrir automatiquement
// tout nouvel aliment ajouté à foods.json sans avoir à maintenir une table exhaustive.

const RULES: [RegExp, string][] = [
  [/oeuf/, '🥚'],
  [/poulet|dinde|volaille/, '🍗'],
  [/boeuf|steak|agneau|porc|jambon|lardons/, '🥩'],
  [/cabillaud|dorade|truite|sardine|maquereau|saumon|thon|poisson/, '🐟'],
  [/crevette|moule|calamar|surimi/, '🦐'],
  [/lait-coco/, '🥥'],
  [/lait/, '🥛'],
  [/fromage|emmental|mozzarella|chevre|feta|cottage/, '🧀'],
  [/yaourt|skyr|fromage-blanc|creme-fraiche/, '🥣'],
  [/beurre-cacahuete/, '🥜'],
  [/beurre/, '🧈'],
  [/riz/, '🍚'],
  [/pates/, '🍝'],
  [/avoine/, '🥣'],
  [/pain/, '🍞'],
  [/pomme-de-terre|patate-douce|polenta/, '🥔'],
  [/quinoa|semoule|boulgour|sarrasin/, '🌾'],
  [/lentille|pois-chiche|haricot|feve|edamame/, '🫘'],
  [/brocoli|epinard|courgette|chou|aubergine|petits-pois/, '🥦'],
  [/carotte|betterave/, '🥕'],
  [/poivron|tomate/, '🍅'],
  [/concombre/, '🥒'],
  [/champignon/, '🍄'],
  [/oignon|ail/, '🧅'],
  [/salade/, '🥬'],
  [/banane/, '🍌'],
  [/^pomme$|^pomme-/, '🍎'],
  [/orange|citron/, '🍊'],
  [/fraise|framboise|myrtille/, '🍓'],
  [/kiwi/, '🥝'],
  [/ananas/, '🍍'],
  [/mangue/, '🥭'],
  [/raisin/, '🍇'],
  [/poire/, '🍐'],
  [/pasteque|melon/, '🍉'],
  [/abricot|peche/, '🍑'],
  [/dattes/, '🌴'],
  [/avocat/, '🥑'],
  [/noix|noisette|cajou|pistache|amande/, '🥜'],
  [/graines/, '🌱'],
  [/huile/, '🫒'],
  [/miel/, '🍯'],
  [/sucre/, '🍬'],
  [/chocolat/, '🍫'],
  [/tofu|seitan/, '🧊'],
  [/houmous/, '🥙'],
];

const DEFAULT_EMOJI = '🍽️';

export function getFoodEmoji(food: { id: string; nom?: string }): string {
  const haystack = `${food.id} ${food.nom ?? ''}`.toLowerCase();
  for (const [pattern, emoji] of RULES) {
    if (pattern.test(haystack)) return emoji;
  }
  return DEFAULT_EMOJI;
}
