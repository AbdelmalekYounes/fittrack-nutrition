import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useAppData } from '../hooks/useAppData';
import { useNutritionTargets } from '../hooks/useNutritionTargets';
import { lastNDays, todayISO, formatDateFr, startOfWeek, addDays } from '../utils/date';
import { buildWeeklyReport } from '../utils/weeklyReport';
import { analyzeAndSuggestAdjustment } from '../utils/adjustmentEngine';
import type { WeightEntry } from '../types';

function emptyForm() {
  return { date: todayISO(), poids: 0, tourDeTailleCm: '', note: '' };
}

export default function Progress() {
  const { profile, weights, setWeights, meals, activities } = useAppData();
  const targets = useNutritionTargets(profile);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState(30);
  const [reportWeekStart, setReportWeekStart] = useState(() => startOfWeek(todayISO()));

  const weeklyReport = useMemo(() => {
    if (!profile || !targets) return null;
    return buildWeeklyReport({ profile, targets, meals, activities, weights, weekStart: reportWeekStart });
  }, [profile, targets, meals, activities, weights, reportWeekStart]);

  const adjustment = useMemo(() => {
    if (!profile || !targets) return null;
    return analyzeAndSuggestAdjustment(profile, targets, meals, weights, activities);
  }, [profile, targets, meals, weights, activities]);

  const sortedWeights = useMemo(
    () => [...weights].sort((a, b) => a.date.localeCompare(b.date)),
    [weights]
  );

  // Statistiques résumées : poids de départ/actuel/objectif et rythme moyen kg/semaine
  // calculé entre la première et la dernière pesée enregistrée.
  const weightStats = useMemo(() => {
    if (!profile) return null;
    const start = sortedWeights[0];
    const last = sortedWeights[sortedWeights.length - 1];
    const startWeight = start?.poids ?? profile.poidsActuel;
    const currentWeight = last?.poids ?? profile.poidsActuel;
    let ratePerWeek: number | null = null;
    if (start && last && start.id !== last.id) {
      const days = (new Date(last.date).getTime() - new Date(start.date).getTime()) / 86_400_000;
      const weeks = days / 7;
      if (weeks > 0) ratePerWeek = (currentWeight - startWeight) / weeks;
    }
    return { startWeight, currentWeight, targetWeight: profile.poidsCible, ratePerWeek };
  }, [profile, sortedWeights]);

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.poids <= 0) return;
    const entry: Omit<WeightEntry, 'id'> = {
      date: form.date,
      poids: form.poids,
      tourDeTailleCm: form.tourDeTailleCm ? Number(form.tourDeTailleCm) : undefined,
      note: form.note || undefined,
    };
    if (editingId) {
      setWeights((prev) => prev.map((w) => (w.id === editingId ? { ...entry, id: editingId } : w)));
    } else {
      setWeights((prev) => [...prev, { ...entry, id: crypto.randomUUID() }]);
    }
    resetForm();
  }

  function handleEdit(entry: WeightEntry) {
    setEditingId(entry.id);
    setForm({
      date: entry.date,
      poids: entry.poids,
      tourDeTailleCm: entry.tourDeTailleCm ? String(entry.tourDeTailleCm) : '',
      note: entry.note ?? '',
    });
  }

  function handleDelete(id: string) {
    setWeights((prev) => prev.filter((w) => w.id !== id));
    if (editingId === id) resetForm();
  }

  const weightChartData = sortedWeights.map((w) => ({
    date: formatDateFr(w.date),
    poids: w.poids,
    objectif: profile?.poidsCible,
  }));

  const days = useMemo(() => lastNDays(rangeDays), [rangeDays]);

  const caloriesChartData = days.map((day) => ({
    date: formatDateFr(day),
    calories: meals.filter((m) => m.date === day).reduce((sum, m) => sum + m.calories, 0),
  }));

  const proteinesChartData = days.map((day) => ({
    date: formatDateFr(day),
    proteines: meals.filter((m) => m.date === day).reduce((sum, m) => sum + m.proteines, 0),
  }));

  const sessionsByWeek = useMemo(() => {
    const weeksMap = new Map<string, number>();
    activities.forEach((a) => {
      const week = startOfWeek(a.date);
      weeksMap.set(week, (weeksMap.get(week) ?? 0) + 1);
    });
    return Array.from(weeksMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([week, count]) => ({
        semaine: `${formatDateFr(week)} - ${formatDateFr(addDays(week, 6))}`,
        seances: count,
      }));
  }, [activities]);

  return (
    <div>
      <div className="page-header">
        <h1>Progression</h1>
        <p className="text-muted">Visualisez votre évolution sur la durée.</p>
        <Link to="/analyse-intelligente" className="btn btn-outline btn-sm" style={{ marginTop: 'var(--space-2)' }}>
          🧠 Voir l'analyse intelligente (coach anti-stagnation)
        </Link>
      </div>

      <div className="card section">
        <h3>{editingId ? 'Modifier la pesée' : 'Ajouter une pesée'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid--2">
            <div className="form-group">
              <label className="form-label" htmlFor="weightDate">Date</label>
              <input id="weightDate" className="form-input" type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="poids">Poids (kg)</label>
              <input id="poids" className="form-input" type="number" step="0.1" value={form.poids} onChange={(e) => setForm((p) => ({ ...p, poids: Number(e.target.value) }))} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="tourTaille">Tour de taille (cm, optionnel)</label>
              <input id="tourTaille" className="form-input" type="number" value={form.tourDeTailleCm} onChange={(e) => setForm((p) => ({ ...p, tourDeTailleCm: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="note">Note (optionnel)</label>
              <input id="note" className="form-input" type="text" value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button type="submit" className="btn btn-primary">{editingId ? 'Mettre à jour' : 'Ajouter la pesée'}</button>
            {editingId && <button type="button" className="btn btn-outline" onClick={resetForm}>Annuler</button>}
          </div>
        </form>
      </div>

      {weightStats && (
        <div className="grid grid--3 section">
          <div className="card">
            <div className="card__title">Poids de départ</div>
            <div className="card__value">{weightStats.startWeight} kg</div>
          </div>
          <div className="card">
            <div className="card__title">Poids actuel</div>
            <div className="card__value">{weightStats.currentWeight} kg</div>
            <p className="text-muted" style={{ marginTop: 'var(--space-1)' }}>Objectif : {weightStats.targetWeight} kg</p>
          </div>
          <div className="card">
            <div className="card__title">Rythme moyen</div>
            <div className="card__value">
              {weightStats.ratePerWeek !== null ? `${weightStats.ratePerWeek > 0 ? '+' : ''}${weightStats.ratePerWeek.toFixed(2)} kg/sem.` : '—'}
            </div>
            <p className="text-muted" style={{ marginTop: 'var(--space-1)' }}>
              {weightStats.ratePerWeek === null
                ? 'Ajoutez au moins 2 pesées pour calculer votre rythme.'
                : 'Entre votre première et votre dernière pesée.'}
            </p>
          </div>
        </div>
      )}

      {weeklyReport && (
        <div className="card section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            <h3>Bilan hebdomadaire — {formatDateFr(weeklyReport.semaineDebut)} au {formatDateFr(weeklyReport.semaineFin)}</h3>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setReportWeekStart((d) => addDays(d, -7))}>← Semaine précédente</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setReportWeekStart(startOfWeek(todayISO()))}>Cette semaine</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setReportWeekStart((d) => addDays(d, 7))}>Semaine suivante →</button>
            </div>
          </div>

          <div className="grid grid--3" style={{ marginTop: 'var(--space-4)' }}>
            <div className="card">
              <div className="card__title">Poids moyen</div>
              <div className="card__value">{weeklyReport.poidsMoyen !== null ? `${weeklyReport.poidsMoyen} kg` : '—'}</div>
              {weeklyReport.evolutionPoidsKg !== null && (
                <p className="text-muted">{weeklyReport.evolutionPoidsKg > 0 ? '+' : ''}{weeklyReport.evolutionPoidsKg} kg sur la semaine</p>
              )}
            </div>
            <div className="card">
              <div className="card__title">Calories / protéines moyennes</div>
              <div className="card__value">{weeklyReport.moyenneCalories} kcal</div>
              <p className="text-muted">{weeklyReport.moyenneProteines} g de protéines / jour</p>
            </div>
            <div className="card">
              <div className="card__title">Régularité</div>
              <div className="card__value">{weeklyReport.regularitePourcent}%</div>
              <p className="text-muted">{weeklyReport.seancesRealisees} séance(s) · {weeklyReport.caloriesBrulees} kcal brûlées</p>
            </div>
          </div>

          <div className="grid grid--2" style={{ marginTop: 'var(--space-4)' }}>
            <div>
              <h4>✅ Points forts</h4>
              <ul style={{ listStyle: 'disc', paddingLeft: 'var(--space-5)' }}>
                {weeklyReport.pointsForts.map((point, i) => <li key={i}>{point}</li>)}
              </ul>
            </div>
            <div>
              <h4>🎯 Points à améliorer</h4>
              {weeklyReport.pointsAmeliorer.length === 0 ? (
                <p className="text-muted">Rien à signaler cette semaine.</p>
              ) : (
                <ul style={{ listStyle: 'disc', paddingLeft: 'var(--space-5)' }}>
                  {weeklyReport.pointsAmeliorer.map((point, i) => <li key={i}>{point}</li>)}
                </ul>
              )}
            </div>
          </div>

          <div className="goal-banner" style={{ marginTop: 'var(--space-4)' }}>
            <span className="goal-banner__icon" aria-hidden="true">💡</span>
            <p style={{ margin: 0 }}><strong>Conseil pour la semaine prochaine :</strong> {weeklyReport.conseilSemaineSuivante}</p>
          </div>
        </div>
      )}

      {adjustment && (
        <div className="card section">
          <h3>Suggestion d'ajustement automatique</h3>
          <p className="text-muted">
            Analyse de vos 7, 14 et 30 derniers jours pour comparer l'évolution réelle à l'objectif prévu.
          </p>
          <div className="grid grid--3">
            {adjustment.analyses.map((a) => (
              <div className="card" key={a.jours}>
                <div className="card__title">{a.jours} derniers jours</div>
                <div className="card__value">{a.moyenneCalories} kcal/j</div>
                <p className="text-muted">
                  {a.rythmePoidsKgParSemaine !== null
                    ? `${a.rythmePoidsKgParSemaine > 0 ? '+' : ''}${a.rythmePoidsKgParSemaine.toFixed(2)} kg/sem.`
                    : 'Pesées insuffisantes'}
                </p>
              </div>
            ))}
          </div>

          <div className="goal-banner" style={{ marginTop: 'var(--space-4)' }}>
            <span className="goal-banner__icon" aria-hidden="true">🎯</span>
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>
                {adjustment.ajustementCaloriesPropose === 0
                  ? `Calories cibles inchangées : ${adjustment.nouvellesCaloriesCibles} kcal/jour.`
                  : `Calories cibles suggérées : ${adjustment.nouvellesCaloriesCibles} kcal/jour (${adjustment.ajustementCaloriesPropose > 0 ? '+' : ''}${adjustment.ajustementCaloriesPropose} kcal vs actuellement).`}
              </p>
              <p className="text-muted" style={{ margin: 0 }}>{adjustment.conseilSportif}</p>
            </div>
          </div>

          {adjustment.messagePrudence && (
            <div className="disclaimer" style={{ marginTop: 'var(--space-3)', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
              ⚠️ {adjustment.messagePrudence}
            </div>
          )}

          <div className="disclaimer" style={{ marginTop: 'var(--space-3)' }}>
            Ces suggestions sont des estimations automatiques basées sur vos données et ne remplacent pas l'avis d'un professionnel de santé ou d'un diététicien.
          </div>
        </div>
      )}

      <div className="card section">
        <h3>Évolution du poids</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={weightChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} domain={['auto', 'auto']} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="poids" name="Poids (kg)" stroke="var(--color-primary)" strokeWidth={2} />
            {profile && (
              <Line type="monotone" dataKey="objectif" name="Objectif (kg)" stroke="var(--color-secondary)" strokeDasharray="5 5" strokeWidth={2} dot={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Calories consommées</h3>
          <select className="form-select" value={rangeDays} onChange={(e) => setRangeDays(Number(e.target.value))}>
            <option value={7}>7 derniers jours</option>
            <option value={30}>30 derniers jours</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={caloriesChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={11} interval={rangeDays > 10 ? 3 : 0} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Bar dataKey="calories" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card section">
        <h3>Protéines consommées</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={proteinesChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={11} interval={rangeDays > 10 ? 3 : 0} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Bar dataKey="proteines" fill="var(--color-proteines)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card section">
        <h3>Séances par semaine</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={sessionsByWeek}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="semaine" fontSize={10} />
            <YAxis fontSize={12} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="seances" name="Séances" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card section">
        <h3>Historique des pesées</h3>
        {sortedWeights.length === 0 && <p className="text-muted">Aucune pesée enregistrée.</p>}
        <ul>
          {[...sortedWeights].reverse().map((entry) => (
            <li className="list-item" key={entry.id}>
              <div className="list-item__main">
                <span className="list-item__title">{entry.poids} kg — {formatDateFr(entry.date)}</span>
                <span className="list-item__subtitle">
                  {entry.tourDeTailleCm ? `Tour de taille : ${entry.tourDeTailleCm} cm` : ''} {entry.note ?? ''}
                </span>
              </div>
              <div className="list-item__actions">
                <button type="button" className="btn-icon" onClick={() => handleEdit(entry)} aria-label="Modifier">✏️</button>
                <button type="button" className="btn-icon" onClick={() => handleDelete(entry.id)} aria-label="Supprimer">🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
