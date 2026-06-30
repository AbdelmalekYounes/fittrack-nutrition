import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import { generateProgram, getExerciseName } from '../utils/program';
import { calculateCaloriesBurned } from '../utils/calculations';
import { todayISO } from '../utils/date';
import exercisesData from '../data/exercises.json';
import type { Exercise, ActivityLog } from '../types';

const exercisesLibrary = exercisesData as Exercise[];

interface SeriesState {
  done: boolean;
  reps: string;
}

/** Mode séance en direct : guide l'utilisateur exercice par exercice et série par série
 * pendant l'entraînement, avec timer de repos, puis enregistre automatiquement la séance
 * dans l'historique d'activités (et la marque terminée dans le programme) à la fin. */
export default function LiveSession() {
  const { seanceId } = useParams<{ seanceId: string }>();
  const { profile, setActivities, completedSessions, setCompletedSessions, programId } = useAppData();

  const program = useMemo(() => (profile ? generateProgram(profile) : null), [profile]);
  const seance = program?.seances.find((s) => s.id === seanceId) ?? null;

  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [seriesState, setSeriesState] = useState<SeriesState[][]>([]);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [ressenti, setRessenti] = useState('');

  // Décompte du timer de repos.
  useEffect(() => {
    if (restSeconds === null || restSeconds <= 0) return;
    const timer = setTimeout(() => setRestSeconds((s) => (s !== null ? s - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [restSeconds]);

  if (!profile) {
    return <p className="text-muted">Complétez d'abord votre profil pour démarrer une séance.</p>;
  }
  if (!program || !seance) {
    return (
      <div className="empty-state card">
        <p>Séance introuvable. Elle a peut-être été régénérée.</p>
        <Link to="/programme" className="btn btn-primary">Retour au programme</Link>
      </div>
    );
  }

  function handleStart() {
    setSeriesState(seance!.exercices.map((ex) => Array.from({ length: ex.series }, () => ({ done: false, reps: ex.repetitions }))));
    setStartTime(Date.now());
    setStarted(true);
  }

  function toggleSerie(exoIdx: number, serieIdx: number) {
    setSeriesState((prev) =>
      prev.map((exo, i) =>
        i !== exoIdx ? exo : exo.map((s, j) => (j === serieIdx ? { ...s, done: !s.done } : s))
      )
    );
    const exo = seance!.exercices[exoIdx];
    const justCompleted = !seriesState[exoIdx][serieIdx].done;
    const isLastSerie = serieIdx === exo.series - 1;
    if (justCompleted && !isLastSerie && exo.tempsReposSecondes > 0) {
      setRestSeconds(exo.tempsReposSecondes);
    }
  }

  function updateReps(exoIdx: number, serieIdx: number, reps: string) {
    setSeriesState((prev) =>
      prev.map((exo, i) => (i !== exoIdx ? exo : exo.map((s, j) => (j === serieIdx ? { ...s, reps } : s))))
    );
  }

  function goToExercise(delta: number) {
    setRestSeconds(null);
    setExerciseIndex((i) => Math.max(0, Math.min(seance!.exercices.length - 1, i + delta)));
  }

  function handleFinish() {
    const dureeMinutes = startTime ? Math.max(1, Math.round((Date.now() - startTime) / 60000)) : seance!.exercices.length * 8;
    const caloriesBrulees = calculateCaloriesBurned('musculation', 'moyenne', dureeMinutes, profile.poidsActuel);
    const exercicesRealises = seance!.exercices.map((ex, i) => {
      const doneCount = seriesState[i]?.filter((s) => s.done).length ?? 0;
      return `${getExerciseName(ex.exerciceId)} (${doneCount}/${ex.series} séries)`;
    });

    const entry: Omit<ActivityLog, 'id'> = {
      date: todayISO(),
      typeActivite: 'musculation',
      dureeMinutes,
      intensite: 'moyenne',
      caloriesBrulees,
      notes: `Séance "${seance!.nom}" réalisée via le mode séance en direct.`,
      exercicesRealises,
      ressenti,
    };
    setActivities((prev) => [...prev, { ...entry, id: crypto.randomUUID() }]);

    if (programId && !completedSessions.some((c) => c.programId === programId && c.seanceId === seance!.id)) {
      setCompletedSessions((prev) => [
        ...prev,
        { id: crypto.randomUUID(), programId, seanceId: seance!.id, date: todayISO() },
      ]);
    }

    setFinished(true);
  }

  // --- Écran de fin (récapitulatif + ressenti) ---
  if (finished) {
    return (
      <div className="empty-state card">
        <h2>✅ Séance enregistrée !</h2>
        <p>Votre séance « {seance.nom} » a été ajoutée à votre historique d'activités.</p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', marginTop: 'var(--space-4)' }}>
          <Link to="/activites" className="btn btn-outline">Voir l'historique</Link>
          <Link to="/programme" className="btn btn-primary">Retour au programme</Link>
        </div>
      </div>
    );
  }

  // --- Écran d'introduction ---
  if (!started) {
    return (
      <div>
        <div className="page-header">
          <h1>{seance.nom}</h1>
          <p className="text-muted">{seance.exercices.length} exercice(s) — démarrez quand vous êtes prêt.</p>
        </div>
        <div className="card section">
          <ul>
            {seance.exercices.map((ex, i) => (
              <li className="list-item" key={`${ex.exerciceId}-${i}`}>
                <div className="list-item__main">
                  <span className="list-item__title">{getExerciseName(ex.exerciceId)}</span>
                  <span className="list-item__subtitle">{ex.series} séries × {ex.repetitions} · repos {ex.tempsReposSecondes}s</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleStart}>▶️ Démarrer la séance</button>
      </div>
    );
  }

  const currentExo = seance.exercices[exerciseIndex];
  const currentDetail = exercisesLibrary.find((e) => e.id === currentExo.exerciceId);
  const currentSeries = seriesState[exerciseIndex] ?? [];

  return (
    <div>
      <div className="page-header">
        <h1>{seance.nom}</h1>
        <p className="text-muted">Exercice {exerciseIndex + 1} / {seance.exercices.length}</p>
      </div>

      <div className="card section">
        <h3>{getExerciseName(currentExo.exerciceId)}</h3>
        {currentDetail && <p className="text-muted">{currentDetail.instructions}</p>}

        <ul>
          {currentSeries.map((serie, i) => (
            <li className="list-item" key={i}>
              <label className="checkbox-pill" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={serie.done} onChange={() => toggleSerie(exerciseIndex, i)} />
                Série {i + 1}
              </label>
              <input
                className="form-input"
                style={{ maxWidth: 140 }}
                type="text"
                value={serie.reps}
                onChange={(e) => updateReps(exerciseIndex, i, e.target.value)}
                aria-label={`Répétitions réalisées série ${i + 1}`}
              />
            </li>
          ))}
        </ul>

        {restSeconds !== null && restSeconds > 0 && (
          <div className="goal-banner" style={{ marginTop: 'var(--space-4)' }}>
            <span className="goal-banner__icon" aria-hidden="true">⏱️</span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--font-size-xl)' }}>{restSeconds}s</p>
              <p className="text-muted" style={{ margin: 0 }}>Temps de repos</p>
            </div>
            <button type="button" className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setRestSeconds(null)}>
              Passer
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-outline" onClick={() => goToExercise(-1)} disabled={exerciseIndex === 0}>
          ← Exercice précédent
        </button>
        {exerciseIndex < seance.exercices.length - 1 && (
          <button type="button" className="btn btn-primary" onClick={() => goToExercise(1)}>
            Exercice suivant →
          </button>
        )}
      </div>

      {exerciseIndex === seance.exercices.length - 1 && (
        <div className="card section" style={{ marginTop: 'var(--space-4)' }}>
          <h3>Terminer la séance</h3>
          <div className="form-group">
            <label className="form-label" htmlFor="ressenti">Ressenti de fin de séance</label>
            <textarea
              id="ressenti"
              className="form-textarea"
              rows={3}
              placeholder="Ex: bonne énergie, séance fatigante, douleur à l'épaule..."
              value={ressenti}
              onChange={(e) => setRessenti(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={handleFinish}>
            ✅ Terminer et enregistrer la séance
          </button>
        </div>
      )}
    </div>
  );
}
