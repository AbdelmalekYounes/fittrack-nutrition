import type { Recipe, TypeRepas, Objectif, PreferenceAlimentaire } from '../types';

export interface RecipeFilterOptions {
  objectif?: Objectif;
  typeRepas?: TypeRepas;
  caloriesRestantes?: number;
  proteinesRestantes?: number;
  preferencesAlimentaires?: PreferenceAlimentaire[];
  allergies?: string[];
  recherche?: string;
}

/** Une recette est compatible si elle satisfait au moins une des préférences sélectionnées
 * (ou s'il n'y a pas de préférence particulière définie). */
function matchesPreferences(recipe: Recipe, preferences: PreferenceAlimentaire[] | undefined): boolean {
  if (!preferences || preferences.length === 0) return true;
  if (preferences.includes('normal')) return true;
  return preferences.every((pref) => recipe.preferencesCompatibles.includes(pref));
}

function containsAllergen(recipe: Recipe, allergies: string[] | undefined): boolean {
  if (!allergies || allergies.length === 0) return false;
  const ingredientsText = recipe.ingredients.join(' ').toLowerCase();
  return allergies.some((allergen) => {
    const term = allergen.trim().toLowerCase();
    return term.length > 0 && ingredientsText.includes(term);
  });
}

/** Filtre les recettes selon le profil et le contexte du jour, sans notion de score. */
export function filterRecipes(recipes: Recipe[], options: RecipeFilterOptions): Recipe[] {
  return recipes.filter((recipe) => {
    if (options.typeRepas && recipe.typeRepas !== options.typeRepas) return false;
    if (containsAllergen(recipe, options.allergies)) return false;
    if (!matchesPreferences(recipe, options.preferencesAlimentaires)) return false;
    if (options.recherche) {
      const query = options.recherche.toLowerCase();
      const haystack = `${recipe.nom} ${recipe.ingredients.join(' ')}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

/** Score une recette : objectif compatible, et proximité des macros restantes du jour. */
function scoreRecipe(recipe: Recipe, options: RecipeFilterOptions): number {
  let score = 0;
  if (options.objectif && recipe.objectifConseille.includes(options.objectif)) {
    score += 50;
  }
  if (typeof options.caloriesRestantes === 'number') {
    const diff = Math.abs(recipe.calories - options.caloriesRestantes);
    score += Math.max(0, 30 - diff / 20);
  }
  if (typeof options.proteinesRestantes === 'number') {
    const diff = Math.abs(recipe.proteines - options.proteinesRestantes);
    score += Math.max(0, 20 - diff / 5);
  }
  return score;
}

/** Trie les recettes filtrées par pertinence décroissante (objectif puis macros restantes). */
export function scoreAndSortRecipes(recipes: Recipe[], options: RecipeFilterOptions): Recipe[] {
  return [...recipes].sort((a, b) => scoreRecipe(b, options) - scoreRecipe(a, options));
}

/** Sélectionne la meilleure recette du jour pour un type de repas donné (ou tout type confondu). */
export function recommendRecipeOfDay(
  recipes: Recipe[],
  options: RecipeFilterOptions
): Recipe | null {
  const filtered = filterRecipes(recipes, options);
  if (filtered.length === 0) return null;
  const sorted = scoreAndSortRecipes(filtered, options);
  return sorted[0];
}

/** Recette la plus riche en protéines compatible avec le profil, utile en récupération
 * après une séance d'activité physique (musculation comme sports cardio/raquette). */
export function recommendRecoveryRecipe(
  recipes: Recipe[],
  options: Pick<RecipeFilterOptions, 'preferencesAlimentaires' | 'allergies'>
): Recipe | null {
  const filtered = filterRecipes(recipes, options);
  if (filtered.length === 0) return null;
  return [...filtered].sort((a, b) => b.proteines - a.proteines)[0];
}
