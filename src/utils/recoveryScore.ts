import type { RecoveryEntry } from '../types';

export type RecommandationSeance = 'intense' | 'normale' | 'legere' | 'repos';

export const RECOMMANDATION_LABELS: Record<RecommandationSeance, string> = {
  intense: 'Séance intense possible',
  normale: 'Séance normale',
  legere: 'Séance légère conseillée',
  repos: 'Repos conseillé',
};

const IDEAL_SLEEP_HOURS = 8;

// Pondération de chaque facteur dans le score final (somme = 1). Les facteurs négatifs
// (fatigue, courbatures, stress) sont inversés avant pondération.
const WEIGHTS = {
  heuresSommeil: 0.15,
  qualiteSommeil: 0.2,
  fatigue: 0.2,
  courbatures: 0.15,
  stress: 0.15,
  motivation: 0.1,
  faim: 0.05,
};

function scaleOn5(value: number, invert = false): number {
  const clamped = Math.max(1, Math.min(5, value));
  const normalized = (clamped - 1) / 4; // 0..1
  return (invert ? 1 - normalized : normalized) * 100;
}

/** Calcule un score de récupération sur 100 à partir de la saisie quotidienne. Une douleur
 * signalée plafonne le score par précaution (la douleur prime sur les autres facteurs). */
export function calculateRecoveryScore(entry: RecoveryEntry): number {
  const sommeilHeuresScore = Math.max(0, 100 - Math.abs(IDEAL_SLEEP_HOURS - entry.heuresSommeil) * 15);

  const score =
    sommeilHeuresScore * WEIGHTS.heuresSommeil +
    scaleOn5(entry.qualiteSommeil) * WEIGHTS.qualiteSommeil +
    scaleOn5(entry.fatigue, true) * WEIGHTS.fatigue +
    scaleOn5(entry.courbatures, true) * WEIGHTS.courbatures +
    scaleOn5(entry.stress, true) * WEIGHTS.stress +
    scaleOn5(entry.motivation) * WEIGHTS.motivation +
    scaleOn5(entry.faim, true) * WEIGHTS.faim;

  const rounded = Math.round(score);
  const hasDouleur = Boolean(entry.douleur && entry.douleur.trim());
  return hasDouleur ? Math.min(rounded, 70) : rounded;
}

/** Recommandation de séance basée sur le score (et la présence éventuelle de douleur,
 * qui impose toujours la prudence quel que soit le score calculé). */
export function getRecoveryRecommendation(entry: RecoveryEntry, score: number): RecommandationSeance {
  if (entry.douleur && entry.douleur.trim()) return 'repos';
  if (score >= 80) return 'intense';
  if (score >= 60) return 'normale';
  if (score >= 40) return 'legere';
  return 'repos';
}
