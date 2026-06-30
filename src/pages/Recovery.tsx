import { useMemo, useState, type FormEvent } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAppData } from '../hooks/useAppData';
import { calculateRecoveryScore, getRecoveryRecommendation, RECOMMANDATION_LABELS, type RecommandationSeance } from '../utils/recoveryScore';
import { todayISO, formatDateFr, lastNDays } from '../utils/date';
import Gauge from '../components/Gauge';
import type { RecoveryEntry } from '../types';

const RECOMMANDATION_COLORS: Record<RecommandationSeance, string> = {
  intense: 'var(--color-secondary)',
  normale: 'var(--color-primary)',
  legere: '#f59e0b',
  repos: 'var(--color-danger)',
};

function emptyEntry(): Omit<RecoveryEntry, 'id'> {
  return {
    date: todayISO(),
    heuresSommeil: 7,
    qualiteSommeil: 3,
    fatigue: 3,
    courbatures: 3,
    stress: 3,
    motivation: 3,
    faim: 3,
    douleur: '',
  };
}

/** Suivi quotidien de récupération : sommeil, fatigue, courbatures, stress, motivation,
 * faim et douleur éventuelle, transformés en un score sur 100 et une recommandation de
 * séance (intense / normale / légère / repos), utilisable pour adapter l'entraînement. */
export default function Recovery() {
  const { recoveryEntries, saveRecoveryEntry } = useAppData();
  const todayEntry = recoveryEntries.find((r) => r.date === todayISO());
  const [form, setForm] = useState<Omit<RecoveryEntry, 'id'>>(todayEntry ?? emptyEntry());

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    saveRecoveryEntry(form);
  }

  const previewScore = calculateRecoveryScore({ ...form, id: 'preview' });
  const previewRecommandation = getRecoveryRecommendation({ ...form, id: 'preview' }, previewScore);

  const history = useMemo(() => {
    const days = lastNDays(14);
    return days.map((day) => {
      const entry = recoveryEntries.find((r) => r.date === day);
      return { date: formatDateFr(day), score: entry ? calculateRecoveryScore(entry) : null };
    });
  }, [recoveryEntries]);

  return (
    <div>
      <div className="page-header">
        <h1>Récupération</h1>
        <p className="text-muted">Une saisie par jour pour adapter l'intensité de votre prochaine séance.</p>
      </div>

      <div className="grid grid--2 section">
        <div className="card">
          <h3>{todayEntry ? "Modifier la saisie d'aujourd'hui" : "Saisie d'aujourd'hui"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="heuresSommeil">Heures de sommeil</label>
              <input id="heuresSommeil" className="form-input" type="number" step="0.5" min={0} max={14} value={form.heuresSommeil} onChange={(e) => updateField('heuresSommeil', Number(e.target.value))} />
            </div>

            {(
              [
                ['qualiteSommeil', 'Qualité du sommeil'],
                ['fatigue', 'Fatigue'],
                ['courbatures', 'Courbatures'],
                ['stress', 'Stress'],
                ['motivation', 'Motivation'],
                ['faim', 'Faim'],
              ] as [keyof typeof form, string][]
            ).map(([key, label]) => (
              <div className="form-group" key={key}>
                <label className="form-label" htmlFor={key}>{label} : {form[key]}/5</label>
                <input
                  id={key}
                  type="range"
                  min={1}
                  max={5}
                  value={form[key] as number}
                  onChange={(e) => updateField(key, Number(e.target.value) as never)}
                  style={{ width: '100%' }}
                />
              </div>
            ))}

            <div className="form-group">
              <label className="form-label" htmlFor="douleur">Douleur éventuelle (optionnel)</label>
              <input
                id="douleur"
                className="form-input"
                type="text"
                placeholder="Ex: tiraillement épaule droite"
                value={form.douleur ?? ''}
                onChange={(e) => updateField('douleur', e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary">
              {todayEntry ? 'Mettre à jour' : 'Enregistrer ma récupération'}
            </button>
          </form>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' }}>
          <Gauge percent={previewScore} label="Score de récupération" color={RECOMMANDATION_COLORS[previewRecommandation]} size={150} />
          <div className="goal-banner">
            <span className="goal-banner__icon" aria-hidden="true">
              {previewRecommandation === 'intense' ? '💪' : previewRecommandation === 'normale' ? '🙂' : previewRecommandation === 'legere' ? '🧘' : '😴'}
            </span>
            <p style={{ margin: 0, fontWeight: 600 }}>{RECOMMANDATION_LABELS[previewRecommandation]}</p>
          </div>
        </div>
      </div>

      <div className="card section">
        <h3>Évolution sur 14 jours</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={11} />
            <YAxis fontSize={12} domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="score" name="Score" stroke="var(--color-primary)" strokeWidth={2} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
