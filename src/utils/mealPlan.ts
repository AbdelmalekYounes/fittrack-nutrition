import type { UserProfile, NutritionTargets, Recipe, TypeRepas, WeeklyMealPlan, MealPlanDay } from '../types';
import { filterRecipes, scoreAndSortRecipes } from './recipes';
import { addDays } from './date';

const MEAL_TYPES: TypeRepas[] = ['petit_dejeuner', 'dejeuner', 'diner', 'collation'];

// Répartition indicative des calories/protéines journalières entre les 4 repas, utilisée
// pour choisir une recette cohérente avec le volume attendu à chaque repas.
const MEAL_SHARE: Record<TypeRepas, number> = {
  petit_dejeuner: 0.25,
  dejeuner: 0.35,
  diner: 0.3,
  collation: 0.1,
};

function pickRecipeFor(
  typeRepas: TypeRepas,
  profile: UserProfile,
  targets: NutritionTargets,
  recipes: Recipe[],
  usedIds: Set<string>,
  excludeId?: string
): string | null {
  const candidates = filterRecipes(recipes, {
    typeRepas,
    preferencesAlimentaires: profile.preferencesAlimentaires,
    allergies: profile.allergies,
  }).filter((r) => r.id !== excludeId);

  if (candidates.length === 0) return null;

  const share = MEAL_SHARE[typeRepas];
  const sorted = scoreAndSortRecipes(candidates, {
    objectif: profile.objectif,
    caloriesRestantes: targets.calories * share,
    proteinesRestantes: targets.proteines * share,
  });

  // On privilégie une recette pas encore utilisée cette semaine pour varier les repas ;
  // si toutes les options ont déjà été utilisées, on reprend la mieux notée.
  const unused = sorted.find((r) => !usedIds.has(r.id));
  return (unused ?? sorted[0]).id;
}

/** Génère un plan alimentaire sur 7 jours adapté à l'objectif, aux préférences et aux
 * allergies du profil, en essayant de varier les recettes d'un jour à l'autre. */
export function generateWeeklyMealPlan(
  profile: UserProfile,
  targets: NutritionTargets,
  recipes: Recipe[],
  weekStart: string
): WeeklyMealPlan {
  const usedIds = new Set<string>();
  const jours: MealPlanDay[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const recettes = {} as Record<TypeRepas, string>;
    for (const type of MEAL_TYPES) {
      const id = pickRecipeFor(type, profile, targets, recipes, usedIds);
      if (id) {
        recettes[type] = id;
        usedIds.add(id);
      }
    }
    return { date, recettes };
  });

  return {
    id: crypto.randomUUID(),
    semaineDebut: weekStart,
    jours,
    genereLe: new Date().toISOString(),
  };
}

/** Remplace la recette d'un seul créneau (jour + type de repas) par une autre, différente
 * de l'actuelle, en évitant si possible les recettes déjà utilisées ailleurs dans la semaine. */
export function replaceMealPlanSlot(
  plan: WeeklyMealPlan,
  date: string,
  typeRepas: TypeRepas,
  profile: UserProfile,
  targets: NutritionTargets,
  recipes: Recipe[]
): WeeklyMealPlan {
  const currentId = plan.jours.find((j) => j.date === date)?.recettes[typeRepas];
  const usedIds = new Set(
    plan.jours.flatMap((j) => Object.values(j.recettes)).filter((id): id is string => Boolean(id))
  );
  const newId = pickRecipeFor(typeRepas, profile, targets, recipes, usedIds, currentId);
  if (!newId) return plan;

  return {
    ...plan,
    jours: plan.jours.map((j) => (j.date !== date ? j : { ...j, recettes: { ...j.recettes, [typeRepas]: newId } })),
  };
}

/** Agrège la liste d'ingrédients de toutes les recettes du plan en une liste de courses
 * dédupliquée (les quantités restent en texte libre, non additionnées numériquement). */
export function buildShoppingList(plan: WeeklyMealPlan, recipes: Recipe[]): string[] {
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));
  const ingredients = new Set<string>();
  plan.jours.forEach((jour) => {
    Object.values(jour.recettes).forEach((recipeId) => {
      const recipe = recipeMap.get(recipeId);
      recipe?.ingredients.forEach((ing) => ingredients.add(ing));
    });
  });
  return Array.from(ingredients).sort((a, b) => a.localeCompare(b, 'fr'));
}

export { MEAL_TYPES };
