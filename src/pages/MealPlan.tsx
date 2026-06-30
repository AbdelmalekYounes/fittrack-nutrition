import { useMemo, useState } from 'react';
import { useAppData } from '../hooks/useAppData';
import { useNutritionTargets } from '../hooks/useNutritionTargets';
import { generateWeeklyMealPlan, replaceMealPlanSlot, buildShoppingList, MEAL_TYPES } from '../utils/mealPlan';
import { startOfWeek, todayISO, formatDateFr } from '../utils/date';
import Modal from '../components/Modal';
import recipesData from '../data/recipes.json';
import type { Recipe, TypeRepas } from '../types';

const recipes = recipesData as Recipe[];

const MEAL_TYPE_LABELS: Record<TypeRepas, string> = {
  petit_dejeuner: 'Petit-déjeuner',
  dejeuner: 'Déjeuner',
  diner: 'Dîner',
  collation: 'Collation',
};

const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function MealPlan() {
  const { profile, mealPlan, setMealPlan } = useAppData();
  const targets = useNutritionTargets(profile);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const recipeMap = useMemo(() => new Map(recipes.map((r) => [r.id, r])), []);
  const shoppingList = useMemo(() => (mealPlan ? buildShoppingList(mealPlan, recipes) : []), [mealPlan]);

  if (!profile) {
    return <p className="text-muted">Complétez d'abord votre profil pour générer un plan alimentaire.</p>;
  }
  if (!targets) return null;

  function handleGenerate() {
    const plan = generateWeeklyMealPlan(profile!, targets!, recipes, startOfWeek(todayISO()));
    setMealPlan(plan);
    setCheckedItems(new Set());
  }

  function handleReplace(date: string, typeRepas: TypeRepas) {
    if (!mealPlan) return;
    setMealPlan(replaceMealPlanSlot(mealPlan, date, typeRepas, profile!, targets!, recipes));
  }

  function toggleChecked(item: string) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  }

  return (
    <div>
      <div className="page-header">
        <h1>Plan alimentaire de la semaine</h1>
        <p className="text-muted">
          Un menu généré automatiquement sur 7 jours selon votre objectif, vos préférences et vos allergies.
        </p>
      </div>

      <div className="card section">
        <button type="button" className="btn btn-primary" onClick={handleGenerate}>
          {mealPlan ? '🔄 Régénérer le plan de la semaine' : '🍽️ Générer mon plan de la semaine'}
        </button>
        {mealPlan && (
          <p className="text-muted" style={{ marginTop: 'var(--space-2)' }}>
            Semaine du {formatDateFr(mealPlan.semaineDebut)}. Cliquez sur une recette pour le détail, ou sur 🔄 pour la remplacer.
          </p>
        )}
      </div>

      {mealPlan && (
        <>
          <div className="meal-plan-grid section">
            {mealPlan.jours.map((jour, i) => (
              <div className="card meal-plan-day" key={jour.date}>
                <h3>{DAY_LABELS[i]}</h3>
                <p className="text-muted" style={{ marginTop: 'calc(var(--space-2) * -1)', marginBottom: 'var(--space-3)' }}>
                  {formatDateFr(jour.date)}
                </p>
                {MEAL_TYPES.map((type) => {
                  const recipe = recipeMap.get(jour.recettes[type]);
                  return (
                    <div className="meal-plan-slot" key={type}>
                      <span className="quick-add-group__label">{MEAL_TYPE_LABELS[type]}</span>
                      {recipe ? (
                        <div className="meal-plan-slot__content">
                          <button type="button" className="meal-plan-slot__recipe" onClick={() => setSelectedRecipe(recipe)}>
                            {recipe.nom}
                            <span className="text-muted"> · {recipe.calories} kcal</span>
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => handleReplace(jour.date, type)}
                            aria-label="Remplacer cette recette"
                          >
                            🔄
                          </button>
                        </div>
                      ) : (
                        <p className="text-muted">Aucune recette compatible trouvée.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="card section">
            <h3>🛒 Liste de courses</h3>
            <p className="text-muted">Générée automatiquement à partir des recettes de la semaine.</p>
            {shoppingList.length === 0 ? (
              <p className="text-muted">Aucun ingrédient à afficher.</p>
            ) : (
              <ul className="shopping-list">
                {shoppingList.map((item) => (
                  <li key={item}>
                    <label className="checkbox-pill" style={{ width: '100%' }}>
                      <input type="checkbox" checked={checkedItems.has(item)} onChange={() => toggleChecked(item)} />
                      <span style={{ textDecoration: checkedItems.has(item) ? 'line-through' : 'none' }}>{item}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {!mealPlan && (
        <div className="empty-state card">Cliquez sur « Générer mon plan de la semaine » pour commencer.</div>
      )}

      {selectedRecipe && (
        <Modal title={selectedRecipe.nom} onClose={() => setSelectedRecipe(null)}>
          <p className="text-muted">
            {selectedRecipe.tempsPreparationMinutes} min · {selectedRecipe.calories} kcal · P {selectedRecipe.proteines}g · G {selectedRecipe.glucides}g · L {selectedRecipe.lipides}g
          </p>
          <div className="section">
            <h4>Ingrédients</h4>
            <ul>
              {selectedRecipe.ingredients.map((ing) => (
                <li key={ing}>• {ing}</li>
              ))}
            </ul>
          </div>
          <div className="section">
            <h4>Étapes</h4>
            <ul>
              {selectedRecipe.etapes.map((etape, i) => (
                <li key={i}>{i + 1}. {etape}</li>
              ))}
            </ul>
          </div>
        </Modal>
      )}
    </div>
  );
}
