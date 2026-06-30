import type { FoodItem } from '../types';

export interface ParsedVoiceItem {
  rawText: string;
  quantiteGrammes: number;
  food: FoodItem | null;
}

const NUMBER_WORDS: Record<string, number> = {
  un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5,
  six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12,
};

// Poids approximatif d'une "unité" pour les aliments couramment comptés à la pièce
// plutôt qu'en grammes (ex. "2 œufs" plutôt que "100g d'œufs").
const UNIT_WEIGHTS: [RegExp, number][] = [
  [/oeuf/, 50],
  [/banane/, 120],
  [/pomme/, 150],
  [/yaourt/, 125],
  [/tranche/, 30],
  [/biscotte/, 10],
];

function estimateUnitWeight(foodNom: string): number {
  const normalized = normalize(foodNom);
  for (const [pattern, weight] of UNIT_WEIGHTS) {
    if (pattern.test(normalized)) return weight;
  }
  return 100; // repli raisonnable si aucune correspondance connue
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les accents (diacritiques) pour un matching plus robuste
    .trim();
}

const FILLER_PREFIXES = [
  "j'ai mangé", 'jai mange', "j'ai pris", 'jai pris', 'manger', 'mangé', 'mange',
];

/** Trouve le meilleur aliment correspondant dans la base (locale + personnalisée) par
 * inclusion de texte normalisé — approche simple mais efficace pour des noms courts. */
function findBestMatch(candidate: string, foods: FoodItem[]): FoodItem | null {
  const normalizedCandidate = normalize(candidate);
  if (!normalizedCandidate) return null;

  let best: FoodItem | null = null;
  let bestScore = 0;
  for (const food of foods) {
    const normalizedNom = normalize(food.nom);
    let score = 0;
    if (normalizedCandidate.includes(normalizedNom)) score = normalizedNom.length;
    else if (normalizedNom.includes(normalizedCandidate)) score = normalizedCandidate.length;
    if (score > bestScore) {
      bestScore = score;
      best = food;
    }
  }
  // Évite les faux positifs sur des correspondances trop courtes (ex. "de" matchant tout).
  return bestScore >= 3 ? best : null;
}

/** Découpe une phrase du type "2 œufs, 100 grammes de riz et 150 grammes de poulet" en une
 * liste d'aliments + quantités estimées, en cherchant chaque aliment dans la base fournie. */
export function parseVoiceMealText(text: string, foods: FoodItem[]): ParsedVoiceItem[] {
  let cleaned = normalize(text);
  for (const prefix of FILLER_PREFIXES) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.slice(prefix.length).trim();
    }
  }

  const segments = cleaned
    .split(/,| et /)
    .map((s) => s.trim())
    .filter(Boolean);

  return segments.map((segment) => {
    const numberMatch = segment.match(/^(\d+)\s*(grammes?|grs?|g|ml|tranches?|unites?|)?\s*(?:de |d')?(.+)$/);
    let quantity: number | null = null;
    let unit = '';
    let rest = segment;

    if (numberMatch) {
      quantity = parseInt(numberMatch[1], 10);
      unit = numberMatch[2] ?? '';
      rest = numberMatch[3];
    } else {
      const wordMatch = segment.match(/^(\w+)\s+(?:de |d')?(.+)$/);
      if (wordMatch && NUMBER_WORDS[wordMatch[1]] !== undefined) {
        quantity = NUMBER_WORDS[wordMatch[1]];
        rest = wordMatch[2];
      }
    }

    const food = findBestMatch(rest, foods);
    const isGramUnit = /^(grammes?|grs?|g|ml)$/.test(unit);

    let quantiteGrammes: number;
    if (quantity === null) {
      quantiteGrammes = 100; // aucune quantité détectée : valeur par défaut modifiable
    } else if (isGramUnit) {
      quantiteGrammes = quantity;
    } else {
      // Quantité "à la pièce" (ex. "2 œufs") : conversion via un poids unitaire estimé.
      quantiteGrammes = quantity * estimateUnitWeight(food?.nom ?? rest);
    }

    return { rawText: segment, quantiteGrammes, food };
  });
}
