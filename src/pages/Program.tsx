import { useMemo } from 'react';
import { useAppData } from '../hooks/useAppData';
import { generateProgram, getExerciseName } from '../utils/program';
import { todayISO } from '../utils/date';

export default function Program() {
  const { profile, programId, setProgramId, completedSessions, setCompletedSessions } = useAppData();

  const program = useMemo(() => (profile ? generateProgram(profile) : null), [profile]);

  if (!profile) {
    return <p className="text-muted">Complétez d'abord votre profil pour générer un programme.</p>;
  }
  if (!program) return null;

  const isGenerated = programId === program.id;
  const completedIds = new Set(
    completedSessions.filter((c) => c.programId === program.id).map((c) => c.seanceId)
  );

  function handleGenerate() {
    setProgramId(program!.id);
  }

  function toggleComplete(seanceId: string) {
    const existing = completedSessions.find(
      (c) => c.programId === program!.id && c.seanceId === seanceId
    );
    if (existing) {
      setCompletedSessions((prev) => prev.filter((c) => c.id !== existing.id));
    } else {
      setCompletedSessions((prev) => [
        ...prev,
        { id: crypto.randomUUID(), programId: program!.id, seanceId, date: todayISO() },
      ]);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Programme d'entraînement</h1>
        <p className="text-muted">
          Programme généré selon votre objectif, votre niveau et votre matériel disponible.
        </p>
      </div>

      <div className="card section">
        <h3>{program.nom}</h3>
        <p className="text-muted">
          Niveau {program.niveau} · {program.seancesParSemaine} séances/semaine · {program.nombreSemaines} semaines
        </p>
        <p>{program.progressionRecommandee}</p>
        <button type="button" className="btn btn-primary" onClick={handleGenerate} disabled={isGenerated}>
          {isGenerated ? 'Programme actif' : 'Générer mon programme'}
        </button>
        {isGenerated && (
          <button type="button" className="btn btn-outline" style={{ marginLeft: 'var(--space-2)' }} onClick={handleGenerate}>
            Régénérer
          </button>
        )}
      </div>

      {isGenerated ? (
        <div className="grid grid--2">
          {program.seances.map((seance) => {
            const done = completedIds.has(seance.id);
            return (
              <div className="card" key={seance.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>{seance.nom}</h3>
                  {done && <span className="badge badge--done">Terminée</span>}
                </div>
                <ul>
                  {seance.exercices.map((ex, i) => (
                    <li className="list-item" key={`${ex.exerciceId}-${i}`}>
                      <div className="list-item__main">
                        <span className="list-item__title">{getExerciseName(ex.exerciceId)}</span>
                        <span className="list-item__subtitle">
                          {ex.series} séries × {ex.repetitions} · repos {ex.tempsReposSecondes}s
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="text-muted">{seance.conseils}</p>
                <button
                  type="button"
                  className={`btn ${done ? 'btn-outline' : 'btn-secondary'}`}
                  onClick={() => toggleComplete(seance.id)}
                >
                  {done ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state card">
          Cliquez sur « Générer mon programme » pour afficher vos séances.
        </div>
      )}
    </div>
  );
}
