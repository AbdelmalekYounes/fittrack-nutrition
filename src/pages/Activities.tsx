import { useMemo, useState, type FormEvent } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAppData } from '../hooks/useAppData';
import { calculateCaloriesBurned } from '../utils/calculations';
import { lastNDays, startOfWeek, todayISO, formatDateFr } from '../utils/date';
import { ACTIVITY_LABELS } from '../utils/activityLabels';
import type { ActivityLog, TypeActivite, Intensite } from '../types';

const INTENSITY_LABELS: Record<Intensite, string> = {
  faible: 'Faible',
  moyenne: 'Moyenne',
  elevee: 'Élevée',
};

function emptyForm(profilePoids: number) {
  return {
    date: todayISO(),
    typeActivite: 'musculation' as TypeActivite,
    dureeMinutes: 45,
    intensite: 'moyenne' as Intensite,
    caloriesBrulees: calculateCaloriesBurned('musculation', 'moyenne', 45, profilePoids),
    notes: '',
    exercicesRealises: '',
    ressenti: '',
  };
}

export default function Activities() {
  const { profile, activities, setActivities } = useAppData();
  const poids = profile?.poidsActuel ?? 70;
  const [form, setForm] = useState(emptyForm(poids));
  const [caloriesEdited, setCaloriesEdited] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function recalcCalories(next: Partial<typeof form>) {
    const merged = { ...form, ...next };
    if (!caloriesEdited) {
      merged.caloriesBrulees = calculateCaloriesBurned(
        merged.typeActivite,
        merged.intensite,
        merged.dureeMinutes,
        poids
      );
    }
    setForm(merged);
  }

  function resetForm() {
    setForm(emptyForm(poids));
    setCaloriesEdited(false);
    setEditingId(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const entry: Omit<ActivityLog, 'id'> = {
      date: form.date,
      typeActivite: form.typeActivite,
      dureeMinutes: form.dureeMinutes,
      intensite: form.intensite,
      caloriesBrulees: form.caloriesBrulees,
      notes: form.notes,
      exercicesRealises: form.exercicesRealises
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      ressenti: form.ressenti,
    };

    if (editingId) {
      setActivities((prev) => prev.map((a) => (a.id === editingId ? { ...entry, id: editingId } : a)));
    } else {
      setActivities((prev) => [...prev, { ...entry, id: crypto.randomUUID() }]);
    }
    resetForm();
  }

  function handleEdit(activity: ActivityLog) {
    setEditingId(activity.id);
    setCaloriesEdited(true);
    setForm({
      date: activity.date,
      typeActivite: activity.typeActivite,
      dureeMinutes: activity.dureeMinutes,
      intensite: activity.intensite,
      caloriesBrulees: activity.caloriesBrulees,
      notes: activity.notes,
      exercicesRealises: activity.exercicesRealises.join(', '),
      ressenti: activity.ressenti,
    });
  }

  function handleDelete(id: string) {
    setActivities((prev) => prev.filter((a) => a.id !== id));
    if (editingId === id) resetForm();
  }

  const weekStart = startOfWeek(todayISO());
  const weekActivities = activities.filter((a) => a.date >= weekStart && a.date <= todayISO());
  const totalDuration = weekActivities.reduce((sum, a) => sum + a.dureeMinutes, 0);
  const totalCalories = weekActivities.reduce((sum, a) => sum + a.caloriesBrulees, 0);

  const mostPracticed = useMemo(() => {
    const counts: Partial<Record<TypeActivite, number>> = {};
    weekActivities.forEach((a) => {
      counts[a.typeActivite] = (counts[a.typeActivite] ?? 0) + 1;
    });
    const entries = Object.entries(counts) as [TypeActivite, number][];
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  }, [weekActivities]);

  const chartData = useMemo(() => {
    const days = lastNDays(7);
    return days.map((day) => ({
      date: formatDateFr(day),
      calories: activities.filter((a) => a.date === day).reduce((sum, a) => sum + a.caloriesBrulees, 0),
    }));
  }, [activities]);

  const sortedActivities = [...activities].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div className="page-header">
        <h1>Activités</h1>
        <p className="text-muted">Enregistrez vos séances et suivez vos statistiques hebdomadaires.</p>
      </div>

      <div className="grid grid--3 section">
        <div className="card">
          <div className="card__title">Séances cette semaine</div>
          <div className="card__value">{weekActivities.length}</div>
        </div>
        <div className="card">
          <div className="card__title">Durée totale</div>
          <div className="card__value">{totalDuration} min</div>
        </div>
        <div className="card">
          <div className="card__title">Calories brûlées</div>
          <div className="card__value">{totalCalories} kcal</div>
        </div>
      </div>

      <div className="card section">
        <h3>Activité la plus pratiquée cette semaine</h3>
        <p>{mostPracticed ? ACTIVITY_LABELS[mostPracticed] : 'Aucune activité enregistrée cette semaine.'}</p>
        <h3>Calories brûlées — 7 derniers jours</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Line type="monotone" dataKey="calories" stroke="var(--color-primary)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card section">
        <h3>{editingId ? 'Modifier la séance' : 'Ajouter une séance'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid--2">
            <div className="form-group">
              <label className="form-label" htmlFor="actDate">Date</label>
              <input id="actDate" className="form-input" type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="actType">Type d'activité</label>
              <select
                id="actType"
                className="form-select"
                value={form.typeActivite}
                onChange={(e) => recalcCalories({ typeActivite: e.target.value as TypeActivite })}
              >
                {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="duree">Durée (minutes)</label>
              <input
                id="duree"
                className="form-input"
                type="number"
                value={form.dureeMinutes}
                onChange={(e) => recalcCalories({ dureeMinutes: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="intensite">Intensité</label>
              <select
                id="intensite"
                className="form-select"
                value={form.intensite}
                onChange={(e) => recalcCalories({ intensite: e.target.value as Intensite })}
              >
                {Object.entries(INTENSITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="caloriesBrulees">Calories brûlées (estimation modifiable)</label>
              <input
                id="caloriesBrulees"
                className="form-input"
                type="number"
                value={form.caloriesBrulees}
                onChange={(e) => {
                  setCaloriesEdited(true);
                  setForm((p) => ({ ...p, caloriesBrulees: Number(e.target.value) }));
                }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ressenti">Ressenti</label>
              <input id="ressenti" className="form-input" type="text" value={form.ressenti} onChange={(e) => setForm((p) => ({ ...p, ressenti: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="exercices">Exercices réalisés (séparés par des virgules)</label>
            <input id="exercices" className="form-input" type="text" value={form.exercicesRealises} onChange={(e) => setForm((p) => ({ ...p, exercicesRealises: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="notes">Notes</label>
            <textarea id="notes" className="form-textarea" rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button type="submit" className="btn btn-primary">{editingId ? 'Mettre à jour' : 'Ajouter la séance'}</button>
            {editingId && <button type="button" className="btn btn-outline" onClick={resetForm}>Annuler</button>}
          </div>
        </form>
      </div>

      <div className="card section">
        <h3>Historique</h3>
        {sortedActivities.length === 0 && <p className="text-muted">Aucune activité enregistrée.</p>}
        <ul>
          {sortedActivities.map((activity) => (
            <li className="list-item" key={activity.id}>
              <div className="list-item__main">
                <span className="list-item__title">
                  {ACTIVITY_LABELS[activity.typeActivite]} — {formatDateFr(activity.date)}
                </span>
                <span className="list-item__subtitle">
                  {activity.dureeMinutes} min · {INTENSITY_LABELS[activity.intensite]} · {activity.caloriesBrulees} kcal
                </span>
              </div>
              <div className="list-item__actions">
                <button type="button" className="btn-icon" onClick={() => handleEdit(activity)} aria-label="Modifier">✏️</button>
                <button type="button" className="btn-icon" onClick={() => handleDelete(activity.id)} aria-label="Supprimer">🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
