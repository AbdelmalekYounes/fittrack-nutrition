import { useMemo, useState } from 'react';
import { useAppData } from '../hooks/useAppData';
import { useNutritionTargets } from '../hooks/useNutritionTargets';
import { filterRecipes, scoreAndSortRecipes, isTopMatch } from '../utils/recipes';
import Modal from '../components/Modal';
import type { Recipe, TypeRepas } from '../types';
import recipesData from '../data/recipes.json';
import { todayISO } from '../utils/date';

const recipes = recipesData as Recipe[];

const MEAL_TYPE_LABELS: Record<TypeRepas, string> = {
  petit_dejeuner: 'Petit-déjeuner',
  dejeuner: 'Déjeuner',
  diner: 'Dîner',
  collation: 'Collation',
};

/** Présélectionne le type de repas le plus pertinent selon l'heure actuelle, pour
 * éviter à l'utilisateur de devoir filtrer manuellement à chaque visite. */
function defaultTypeForHour(): TypeRepas | 'tous' {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11) return 'petit_dejeuner';
  if (hour >= 11 && hour < 15) return 'dejeuner';
  if (hour >= 15 && hour < 19) return 'collation';
  if (hour >= 19 && hour < 23) return 'diner';
  return 'tous';
}

export default function Recipes() {
  const { profile, meals } = useAppData();
  const targets = useNutritionTargets(profile);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeRepas | 'tous'>(defaultTypeForHour);
  const [selected, setSelected] = useState<Recipe | null>(null);

  const todaysMeals = meals.filter((m) => m.date === todayISO());
  const consumed = todaysMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      proteines: acc.proteines + m.proteines,
      glucides: acc.glucides + m.glucides,
      lipides: acc.lipides + m.lipides,
    }),
    { calories: 0, proteines: 0, glucides: 0, lipides: 0 }
  );
  const caloriesRestantes = targets ? Math.max(0, targets.calories - consumed.calories) : undefined;
  const proteinesRestantes = targets ? Math.max(0, targets.proteines - consumed.proteines) : undefined;
  const glucidesRestantes = targets ? Math.max(0, targets.glucides - consumed.glucides) : undefined;
  const lipidesRestantes = targets ? Math.max(0, targets.lipides - consumed.lipides) : undefined;

  const scoringOptions = {
    objectif: profile?.objectif,
    caloriesRestantes,
    proteinesRestantes,
    glucidesRestantes,
    lipidesRestantes,
  };

  const filtered = useMemo(() => {
    const base = filterRecipes(recipes, {
      typeRepas: typeFilter === 'tous' ? undefined : typeFilter,
      recherche: search,
      preferencesAlimentaires: profile?.preferencesAlimentaires,
      allergies: profile?.allergies,
    });
    return scoreAndSortRecipes(base, scoringOptions);
  }, [search, typeFilter, profile, caloriesRestantes, proteinesRestantes, glucidesRestantes, lipidesRestantes]);

  return (
    <div>
      <div className="page-header">
        <h1>Recettes</h1>
        <p className="text-muted">
          Recettes triées selon votre objectif et vos macros restantes aujourd'hui.
        </p>
      </div>

      <div className="card section">
        <div className="grid grid--2">
          <div className="form-group">
            <label className="form-label" htmlFor="search">Rechercher</label>
            <input
              id="search"
              className="form-input"
              type="text"
              placeholder="Nom ou ingrédient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="typeFilter">Type de repas</label>
            <select
              id="typeFilter"
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeRepas | 'tous')}
            >
              <option value="tous">Tous</option>
              {Object.entries(MEAL_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid--3">
        {filtered.map((recipe) => (
          <div className="card card--clickable" key={recipe.id} onClick={() => setSelected(recipe)}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <span className="badge">{MEAL_TYPE_LABELS[recipe.typeRepas]}</span>
              {isTopMatch(recipe, scoringOptions) && (
                <span className="badge badge--done">★ Recommandé pour vous</span>
              )}
            </div>
            <h3 style={{ marginTop: 'var(--space-2)' }}>{recipe.nom}</h3>
            <p className="text-muted">{recipe.tempsPreparationMinutes} min · {recipe.calories} kcal</p>
            <p className="text-muted">P {recipe.proteines}g · G {recipe.glucides}g · L {recipe.lipides}g</p>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state card">Aucune recette ne correspond à ces critères.</div>
      )}

      {selected && (
        <Modal title={selected.nom} onClose={() => setSelected(null)}>
          <p className="text-muted">
            {selected.tempsPreparationMinutes} min · {selected.calories} kcal · P {selected.proteines}g · G {selected.glucides}g · L {selected.lipides}g
          </p>

          <div className="section">
            <h4>Ingrédients</h4>
            <ul>
              {selected.ingredients.map((ing) => (
                <li key={ing}>• {ing}</li>
              ))}
            </ul>
          </div>

          <div className="section">
            <h4>Étapes</h4>
            <ul>
              {selected.etapes.map((etape, i) => (
                <li key={i}>{i + 1}. {etape}</li>
              ))}
            </ul>
          </div>
        </Modal>
      )}
    </div>
  );
}
