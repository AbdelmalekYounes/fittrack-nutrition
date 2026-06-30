import { useMemo, useState, type FormEvent } from 'react';
import { useAppData } from '../hooks/useAppData';
import { useNutritionTargets } from '../hooks/useNutritionTargets';
import ProgressBar from '../components/ProgressBar';
import FoodPicker from '../components/FoodPicker';
import type { FoodItem, MealEntry, TypeRepas } from '../types';
import { todayISO } from '../utils/date';
import { getFoodEmoji } from '../utils/foodIcons';

const MEAL_TYPE_LABELS: Record<TypeRepas, string> = {
  petit_dejeuner: 'Petit-déjeuner',
  dejeuner: 'Déjeuner',
  diner: 'Dîner',
  collation: 'Collation',
};

const MEAL_TYPES: TypeRepas[] = ['petit_dejeuner', 'dejeuner', 'diner', 'collation'];

function emptyManual() {
  return { nom: '', calories: 0, proteines: 0, glucides: 0, lipides: 0, fibres: 0 };
}

export default function Nutrition() {
  const { profile, meals, setMeals } = useAppData();
  const targets = useNutritionTargets(profile);

  const [date, setDate] = useState(todayISO());
  const [typeRepas, setTypeRepas] = useState<TypeRepas>('petit_dejeuner');
  const [mode, setMode] = useState<'aliment' | 'manuel'>('aliment');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantite, setQuantite] = useState(100);
  const [manual, setManual] = useState(emptyManual());
  const [editingId, setEditingId] = useState<string | null>(null);

  const dayMeals = useMemo(() => meals.filter((m) => m.date === date), [meals, date]);

  const totals = dayMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      proteines: acc.proteines + m.proteines,
      glucides: acc.glucides + m.glucides,
      lipides: acc.lipides + m.lipides,
      fibres: acc.fibres + m.fibres,
    }),
    { calories: 0, proteines: 0, glucides: 0, lipides: 0, fibres: 0 }
  );

  function resetForm() {
    setSelectedFood(null);
    setQuantite(100);
    setManual(emptyManual());
    setEditingId(null);
    setMode('aliment');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    let entry: Omit<MealEntry, 'id'>;
    if (mode === 'aliment') {
      if (!selectedFood || quantite <= 0) return;
      const factor = quantite / 100;
      entry = {
        date,
        typeRepas,
        nom: selectedFood.nom,
        quantiteGrammes: quantite,
        calories: Math.round(selectedFood.caloriesPour100g * factor),
        proteines: Math.round(selectedFood.proteinesPour100g * factor * 10) / 10,
        glucides: Math.round(selectedFood.glucidesPour100g * factor * 10) / 10,
        lipides: Math.round(selectedFood.lipidesPour100g * factor * 10) / 10,
        fibres: Math.round(selectedFood.fibresPour100g * factor * 10) / 10,
      };
    } else {
      if (!manual.nom.trim()) return;
      entry = {
        date,
        typeRepas,
        nom: manual.nom,
        quantiteGrammes: quantite,
        calories: manual.calories,
        proteines: manual.proteines,
        glucides: manual.glucides,
        lipides: manual.lipides,
        fibres: manual.fibres,
      };
    }

    if (editingId) {
      setMeals((prev) => prev.map((m) => (m.id === editingId ? { ...entry, id: editingId } : m)));
    } else {
      setMeals((prev) => [...prev, { ...entry, id: crypto.randomUUID() }]);
    }
    resetForm();
  }

  function handleEdit(meal: MealEntry) {
    setEditingId(meal.id);
    setDate(meal.date);
    setTypeRepas(meal.typeRepas);
    setMode('manuel');
    setQuantite(meal.quantiteGrammes);
    setManual({
      nom: meal.nom,
      calories: meal.calories,
      proteines: meal.proteines,
      glucides: meal.glucides,
      lipides: meal.lipides,
      fibres: meal.fibres,
    });
  }

  function handleDelete(id: string) {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    if (editingId === id) resetForm();
  }

  if (!profile) {
    return <p className="text-muted">Complétez d'abord votre profil pour suivre votre nutrition.</p>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Nutrition</h1>
        <p className="text-muted">Enregistrez vos repas et suivez vos macronutriments.</p>
      </div>

      {targets && (
        <div className="card section">
          <h3>Totaux du {date}</h3>
          <ProgressBar label="Calories" current={totals.calories} target={targets.calories} unit="kcal" />
          <ProgressBar label="Protéines" current={totals.proteines} target={targets.proteines} unit="g" color="var(--color-proteines)" />
          <ProgressBar label="Glucides" current={totals.glucides} target={targets.glucides} unit="g" color="var(--color-glucides)" />
          <ProgressBar label="Lipides" current={totals.lipides} target={targets.lipides} unit="g" color="var(--color-lipides)" />
          <p className="text-muted">Fibres consommées : {Math.round(totals.fibres * 10) / 10} g</p>
        </div>
      )}

      <div className="card section">
        <h3>{editingId ? 'Modifier le repas' : 'Ajouter un repas'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid--2">
            <div className="form-group">
              <label className="form-label" htmlFor="date">Date</label>
              <input id="date" className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="typeRepas">Type de repas</label>
              <select id="typeRepas" className="form-select" value={typeRepas} onChange={(e) => setTypeRepas(e.target.value as TypeRepas)}>
                {MEAL_TYPES.map((t) => (
                  <option key={t} value={t}>{MEAL_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <div className="checkbox-group">
              <button type="button" className={`btn btn-sm ${mode === 'aliment' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setMode('aliment')}>
                Aliment prédéfini
              </button>
              <button type="button" className={`btn btn-sm ${mode === 'manuel' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setMode('manuel')}>
                Saisie manuelle
              </button>
            </div>
          </div>

          {mode === 'aliment' ? (
            <>
              <FoodPicker selectedId={selectedFood?.id} onSelect={setSelectedFood} />
              {selectedFood && (
                <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
                  <label className="form-label" htmlFor="quantite">
                    Quantité (g) — <span className="food-emoji" aria-hidden="true">{getFoodEmoji(selectedFood)}</span> {selectedFood.nom}
                  </label>
                  <input
                    id="quantite"
                    className="form-input"
                    type="number"
                    min={1}
                    value={quantite}
                    onChange={(e) => setQuantite(Number(e.target.value))}
                  />
                  <p className="text-muted">
                    ≈ {Math.round((selectedFood.caloriesPour100g * quantite) / 100)} kcal ·{' '}
                    {Math.round((selectedFood.proteinesPour100g * quantite) / 100)} g protéines
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid--2">
              <div className="form-group">
                <label className="form-label" htmlFor="nomManuel">Nom de l'aliment</label>
                <input
                  id="nomManuel"
                  className="form-input"
                  type="text"
                  value={manual.nom}
                  onChange={(e) => setManual((p) => ({ ...p, nom: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="quantiteManuel">Quantité (g)</label>
                <input
                  id="quantiteManuel"
                  className="form-input"
                  type="number"
                  value={quantite}
                  onChange={(e) => setQuantite(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="calories">Calories (kcal)</label>
                <input id="calories" className="form-input" type="number" value={manual.calories} onChange={(e) => setManual((p) => ({ ...p, calories: Number(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="proteines">Protéines (g)</label>
                <input id="proteines" className="form-input" type="number" value={manual.proteines} onChange={(e) => setManual((p) => ({ ...p, proteines: Number(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="glucides">Glucides (g)</label>
                <input id="glucides" className="form-input" type="number" value={manual.glucides} onChange={(e) => setManual((p) => ({ ...p, glucides: Number(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="lipides">Lipides (g)</label>
                <input id="lipides" className="form-input" type="number" value={manual.lipides} onChange={(e) => setManual((p) => ({ ...p, lipides: Number(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="fibres">Fibres (g)</label>
                <input id="fibres" className="form-input" type="number" value={manual.fibres} onChange={(e) => setManual((p) => ({ ...p, fibres: Number(e.target.value) }))} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Mettre à jour' : 'Ajouter le repas'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-outline" onClick={resetForm}>
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      {MEAL_TYPES.map((type) => {
        const items = dayMeals.filter((m) => m.typeRepas === type);
        if (items.length === 0) return null;
        return (
          <div className="card section" key={type}>
            <h3>{MEAL_TYPE_LABELS[type]}</h3>
            <ul>
              {items.map((meal) => (
                <li className="list-item" key={meal.id}>
                  <div className="list-item__main">
                    <span className="list-item__title">
                      <span className="food-emoji" aria-hidden="true">{getFoodEmoji({ id: '', nom: meal.nom })}</span> {meal.nom}
                    </span>
                    <span className="list-item__subtitle">
                      {meal.quantiteGrammes} g · {meal.calories} kcal · P {meal.proteines}g · G {meal.glucides}g · L {meal.lipides}g
                    </span>
                  </div>
                  <div className="list-item__actions">
                    <button type="button" className="btn-icon" onClick={() => handleEdit(meal)} aria-label="Modifier">✏️</button>
                    <button type="button" className="btn-icon" onClick={() => handleDelete(meal.id)} aria-label="Supprimer">🗑️</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {dayMeals.length === 0 && (
        <div className="empty-state card">Aucun repas enregistré pour cette date.</div>
      )}
    </div>
  );
}
