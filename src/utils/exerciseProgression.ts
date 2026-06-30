import type { ExerciseLog, DifficulteRessentie } from '../types';

export interface PersonalRecord {
  repetitions: number;
  chargeKg?: number;
  date: string;
}

const PROGRESSION_MESSAGES: Record<DifficulteRessentie, string> = {
  tres_facile: 'Très facile la dernière fois : ajoutez une série supplémentaire.',
  facile: 'Facile la dernière fois : essayez +1 à +2 répétitions par série.',
  normale: 'Ressenti normal : maintenez le même volume.',
  difficile: "Difficile la dernière fois : maintenez la charge/répétitions, ne pas augmenter pour l'instant.",
  echec: 'Échec la dernière fois : réduisez légèrement la charge ou les répétitions.',
};

export function getExerciseHistory(exerciceId: string, logs: ExerciseLog[]): ExerciseLog[] {
  return logs
    .filter((l) => l.exerciceId === exerciceId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Meilleure série jamais réalisée : priorité à la charge la plus lourde, puis aux
 * répétitions (pertinent aussi pour les exercices au poids du corps, sans charge). */
export function getPersonalRecord(history: ExerciseLog[]): PersonalRecord | null {
  let best: PersonalRecord | null = null;
  for (const log of history) {
    for (const serie of log.series) {
      const better =
        !best ||
        (serie.chargeKg ?? 0) > (best.chargeKg ?? 0) ||
        ((serie.chargeKg ?? 0) === (best.chargeKg ?? 0) && serie.repetitions > best.repetitions);
      if (better) best = { repetitions: serie.repetitions, chargeKg: serie.chargeKg, date: log.date };
    }
  }
  return best;
}

/** Volume total cumulé (charge × répétitions ; répétitions seules pour les exercices au
 * poids du corps), tous logs confondus pour cet exercice. */
export function getTotalVolume(history: ExerciseLog[]): number {
  return history.reduce(
    (sum, log) => sum + log.series.reduce((s, serie) => s + (serie.chargeKg ?? 1) * serie.repetitions, 0),
    0
  );
}

/** Recommandation de progression basée sur la difficulté ressentie lors de la dernière
 * séance loggée pour cet exercice. Règles simples et toujours raisonnables (jamais de saut
 * de charge agressif). */
export function suggestNextProgression(history: ExerciseLog[]): string | null {
  const last = history[0];
  if (!last) return null;
  return PROGRESSION_MESSAGES[last.difficulte];
}
