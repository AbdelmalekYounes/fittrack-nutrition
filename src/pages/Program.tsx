import { useMemo, useState } from 'react';
import { useAppData } from '../hooks/useAppData';
import { generateProgram, getExerciseName } from '../utils/program';
import { getCardioPrograms } from '../utils/cardioPrograms';
import { ACTIVITY_LABELS } from '../utils/activityLabels';
import { todayISO } from '../utils/date';
import Modal from '../components/Modal';
import recipesData from '../data/recipes.json';
import type { Recipe } from '../types';

const recipes = recipesData as Recipe[];

export default function Program() {
  const { profile, programId, setProgramId, completedSessions, setCompletedSessions } = useAppData();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const program = useMemo(() => (profile ? generateProgram(profile) : null), [profile]);
  const cardioPrograms = useMemo(
    () => (profile ? getCardioPrograms(profile, recipes) : []),
    [profile]
  );

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

      <div className="card section">
        <h3>Principes d'entraînement</h3>
        <ul>
          <li>🔥 <strong>Échauffement</strong> : 5 à 10 minutes de cardio léger et de mobilité articulaire avant chaque séance.</li>
          <li>🧊 <strong>Retour au calme</strong> : étirements doux 5 minutes en fin de séance pour favoriser la récupération.</li>
          <li>📊 <strong>RPE (effort perçu)</strong> : visez 7-8/10 sur les séries de travail, 9-10/10 réservé aux séances avancées.</li>
          <li>📅 <strong>Semaine de décharge</strong> : réduisez le volume de 40% toutes les 4 semaines pour permettre la surcompensation.</li>
        </ul>
      </div>

      {isGenerated ? (
        <div className="grid grid--2 section">
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
        <div className="empty-state card section">
          Cliquez sur « Générer mon programme » pour afficher vos séances.
        </div>
      )}

      {cardioPrograms.length > 0 && (
        <div className="section">
          <div className="page-header">
            <h2>Autres activités physiques</h2>
            <p className="text-muted">
              Plans hebdomadaires pour vos sports en dehors de la salle, avec calories estimées et une recette de récupération adaptée.
            </p>
          </div>
          <div className="grid grid--2">
            {cardioPrograms.map((cardio) => (
              <div className="card" key={cardio.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>{cardio.nom}</h3>
                  <span className="badge">{ACTIVITY_LABELS[cardio.typeActivite]}</span>
                </div>
                <p className="text-muted">
                  {cardio.seancesParSemaine} séance(s)/semaine · {cardio.dureeMinutes} min
                  {cardio.distanceKm ? ` · ${cardio.distanceKm} km` : ''}
                </p>
                <p>{cardio.conseils}</p>
                <p>
                  <strong>≈ {cardio.caloriesParSeance} kcal</strong> brûlées par séance ·{' '}
                  <strong>{cardio.caloriesParSemaine} kcal</strong>/semaine (estimation)
                </p>
                {cardio.recetteRecuperation && (
                  <div className="recovery-recipe">
                    <p className="text-muted" style={{ marginBottom: 'var(--space-1)' }}>Recette de récupération recommandée :</p>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setSelectedRecipe(cardio.recetteRecuperation)}
                    >
                      {cardio.recetteRecuperation.nom} ({cardio.recetteRecuperation.proteines}g protéines)
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
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
