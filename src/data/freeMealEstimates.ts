// Estimations de repas "difficiles à calculer" (restaurant, fast-food, etc.) à 3 niveaux
// (basse/moyenne/haute), avec une répartition macro typique par type de repas permettant
// de dériver des grammes approximatifs de protéines/glucides/lipides à partir des calories.
export type FreeMealType =
  | 'restaurant'
  | 'fast_food'
  | 'repas_familial'
  | 'buffet'
  | 'pizza'
  | 'burger'
  | 'tacos'
  | 'kebab'
  | 'couscous'
  | 'pates'
  | 'dessert'
  | 'boisson_sucree';

export type NiveauEstimation = 'basse' | 'moyenne' | 'haute';

export interface FreeMealEstimate {
  type: FreeMealType;
  label: string;
  emoji: string;
  caloriesParNiveau: Record<NiveauEstimation, number>;
  // Répartition indicative des calories entre macronutriments (somme = 1).
  repartition: { proteines: number; glucides: number; lipides: number };
}

export const FREE_MEAL_ESTIMATES: FreeMealEstimate[] = [
  { type: 'restaurant', label: 'Restaurant (entrée/plat/dessert)', emoji: '🍽️', caloriesParNiveau: { basse: 600, moyenne: 900, haute: 1300 }, repartition: { proteines: 0.2, glucides: 0.45, lipides: 0.35 } },
  { type: 'fast_food', label: 'Fast-food (menu complet)', emoji: '🍟', caloriesParNiveau: { basse: 700, moyenne: 1000, haute: 1400 }, repartition: { proteines: 0.15, glucides: 0.45, lipides: 0.4 } },
  { type: 'repas_familial', label: 'Repas familial', emoji: '🍲', caloriesParNiveau: { basse: 700, moyenne: 1000, haute: 1400 }, repartition: { proteines: 0.2, glucides: 0.45, lipides: 0.35 } },
  { type: 'buffet', label: 'Buffet à volonté', emoji: '🍱', caloriesParNiveau: { basse: 800, moyenne: 1200, haute: 1800 }, repartition: { proteines: 0.15, glucides: 0.45, lipides: 0.4 } },
  { type: 'pizza', label: 'Pizza', emoji: '🍕', caloriesParNiveau: { basse: 500, moyenne: 800, haute: 1200 }, repartition: { proteines: 0.15, glucides: 0.5, lipides: 0.35 } },
  { type: 'burger', label: 'Burger (menu)', emoji: '🍔', caloriesParNiveau: { basse: 500, moyenne: 800, haute: 1200 }, repartition: { proteines: 0.2, glucides: 0.4, lipides: 0.4 } },
  { type: 'tacos', label: 'Tacos (type français)', emoji: '🌯', caloriesParNiveau: { basse: 600, moyenne: 900, haute: 1300 }, repartition: { proteines: 0.2, glucides: 0.45, lipides: 0.35 } },
  { type: 'kebab', label: 'Kebab', emoji: '🥙', caloriesParNiveau: { basse: 600, moyenne: 850, haute: 1100 }, repartition: { proteines: 0.2, glucides: 0.45, lipides: 0.35 } },
  { type: 'couscous', label: 'Couscous', emoji: '🍛', caloriesParNiveau: { basse: 600, moyenne: 850, haute: 1100 }, repartition: { proteines: 0.2, glucides: 0.55, lipides: 0.25 } },
  { type: 'pates', label: 'Pâtes (portion généreuse)', emoji: '🍝', caloriesParNiveau: { basse: 500, moyenne: 700, haute: 950 }, repartition: { proteines: 0.15, glucides: 0.6, lipides: 0.25 } },
  { type: 'dessert', label: 'Dessert', emoji: '🍰', caloriesParNiveau: { basse: 200, moyenne: 400, haute: 650 }, repartition: { proteines: 0.05, glucides: 0.55, lipides: 0.4 } },
  { type: 'boisson_sucree', label: 'Boisson sucrée', emoji: '🥤', caloriesParNiveau: { basse: 100, moyenne: 180, haute: 300 }, repartition: { proteines: 0, glucides: 1, lipides: 0 } },
];

export interface FreeMealMacros {
  calories: number;
  proteines: number;
  glucides: number;
  lipides: number;
  fibres: number;
}

/** Dérive des macros approximatives (en grammes) à partir des calories choisies et de la
 * répartition typique du type de repas. Protéines/glucides = 4 kcal/g, lipides = 9 kcal/g. */
export function estimateFreeMealMacros(estimate: FreeMealEstimate, niveau: NiveauEstimation): FreeMealMacros {
  const calories = estimate.caloriesParNiveau[niveau];
  const proteines = Math.round((calories * estimate.repartition.proteines) / 4);
  const glucides = Math.round((calories * estimate.repartition.glucides) / 4);
  const lipides = Math.round((calories * estimate.repartition.lipides) / 9);
  const fibres = Math.round((calories / 500) * 2); // estimation grossière, repas "libres" généralement pauvres en fibres
  return { calories, proteines, glucides, lipides, fibres };
}
