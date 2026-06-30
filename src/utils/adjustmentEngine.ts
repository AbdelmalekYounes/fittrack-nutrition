import type { UserProfile, MealEntry, WeightEntry, ActivityLog, NutritionTargets, AdjustmentSuggestion, PeriodAnalysis } from '../types';
import { calculateBMR } from './calculations';
import { addDays, todayISO } from './date';

// Bornes de sécurité : l'ajustement proposé ne dépasse jamais ce delta quotidien, et les
// calories cibles ne descendent jamais sous le métabolisme de base ni sous un plancher
// absolu par sexe — "ne jamais proposer de valeur dangereuse".
const MAX_DAILY_ADJUSTMENT = 300;
export const ABSOLUTE_FLOOR: Record<UserProfile['sexe'], number> = { homme: 1500, femme: 1200 };
const KCAL_PER_KG = 7700;

// Rythme de variation de poids jugé raisonnable selon l'objectif (kg/semaine).
export const EXPECTED_RATE: Record<UserProfile['objectif'], number> = {
  perte_de_poids: -0.5,
  recomposition_corporelle: -0.25,
  prise_de_muscle: 0.25,
  renforcement_musculaire: 0,
  maintien: 0,
};

export function periodRate(weights: WeightEntry[], from: string, to: string): number | null {
  const inRange = [...weights].filter((w) => w.date >= from && w.date <= to).sort((a, b) => a.date.localeCompare(b.date));
  if (inRange.length < 2) return null;
  const first = inRange[0];
  const last = inRange[inRange.length - 1];
  const days = (new Date(last.date).getTime() - new Date(first.date).getTime()) / 86_400_000;
  if (days <= 0) return null;
  return ((last.poids - first.poids) / days) * 7;
}

export function averageCalories(meals: MealEntry[], from: string, to: string): number {
  const inRange = meals.filter((m) => m.date >= from && m.date <= to);
  const days = new Set(inRange.map((m) => m.date)).size;
  if (days === 0) return 0;
  return Math.round(inRange.reduce((sum, m) => sum + m.calories, 0) / days);
}

/** Analyse les 7, 14 et 30 derniers jours et propose un ajustement calorique/sportif
 * raisonné et borné. Toujours une estimation — jamais un avis médical. */
export function analyzeAndSuggestAdjustment(
  profile: UserProfile,
  targets: NutritionTargets,
  meals: MealEntry[],
  weights: WeightEntry[],
  activities: ActivityLog[]
): AdjustmentSuggestion {
  const today = todayISO();
  const periods: (7 | 14 | 30)[] = [7, 14, 30];

  const analyses: PeriodAnalysis[] = periods.map((jours) => {
    const from = addDays(today, -(jours - 1));
    return {
      jours,
      moyenneCalories: averageCalories(meals, from, today),
      rythmePoidsKgParSemaine: periodRate(weights, from, today),
    };
  });

  // On privilégie la période la plus longue disposant d'assez de pesées pour être fiable.
  const reliable = [...analyses].reverse().find((a) => a.rythmePoidsKgParSemaine !== null);
  const rythmeAttenduKgParSemaine = EXPECTED_RATE[profile.objectif];

  const bmr = calculateBMR(profile);
  const floor = Math.max(bmr, ABSOLUTE_FLOOR[profile.sexe]);

  if (!reliable || reliable.rythmePoidsKgParSemaine === null) {
    return {
      analyses,
      rythmeAttenduKgParSemaine,
      ajustementCaloriesPropose: 0,
      nouvellesCaloriesCibles: targets.calories,
      conseilSportif: 'Pas assez de pesées pour évaluer la tendance sportive : continuez à enregistrer vos séances.',
      messagePrudence:
        "Pas assez de pesées espacées dans le temps pour calculer un ajustement fiable. Ajoutez au moins deux pesées dans la page Progression.",
    };
  }

  const rythmeReel = reliable.rythmePoidsKgParSemaine;
  const rawAdjustment = ((rythmeAttenduKgParSemaine - rythmeReel) * KCAL_PER_KG) / 7;
  const clamped = Math.max(-MAX_DAILY_ADJUSTMENT, Math.min(MAX_DAILY_ADJUSTMENT, Math.round(rawAdjustment)));
  const wasClamped = Math.round(rawAdjustment) !== clamped;

  let nouvellesCaloriesCibles = Math.round(targets.calories + clamped);
  if (nouvellesCaloriesCibles < floor) nouvellesCaloriesCibles = floor;

  const ajustementCaloriesPropose = nouvellesCaloriesCibles - targets.calories;

  // Conseil sportif basé sur la régularité réelle des séances sur la période fiable.
  const from = addDays(today, -(reliable.jours - 1));
  const seancesPeriode = activities.filter((a) => a.date >= from && a.date <= today).length;
  const seancesAttenduesPeriode = Math.round((profile.seancesParSemaine * reliable.jours) / 7);
  let conseilSportif: string;
  if (seancesPeriode < seancesAttenduesPeriode) {
    conseilSportif = `Vous avez réalisé ${seancesPeriode} séance(s) sur les ${reliable.jours} derniers jours (objectif ≈ ${seancesAttenduesPeriode}) : essayez d'ajouter une séance la semaine prochaine.`;
  } else if (Math.abs(rythmeReel) > Math.abs(rythmeAttenduKgParSemaine) * 1.8 && rythmeAttenduKgParSemaine !== 0) {
    conseilSportif = "Le rythme observé est nettement plus rapide qu'attendu : envisagez de réduire légèrement l'intensité pour limiter le risque de fatigue.";
  } else {
    conseilSportif = 'Votre fréquence d\'entraînement est cohérente avec votre objectif : maintenez ce rythme.';
  }

  // Message de prudence si le rythme réel est jugé excessif (perte ou prise rapide).
  let messagePrudence: string | undefined;
  const poidsActuel = profile.poidsActuel;
  const rythmePourcentPoids = Math.abs(rythmeReel) / poidsActuel; // par semaine
  if (rythmePourcentPoids > 0.01) {
    messagePrudence =
      'Le rythme de variation de poids observé dépasse 1% du poids corporel par semaine, ce qui est considéré comme rapide. Il est recommandé d\'en discuter avec un professionnel de santé.';
  } else if (wasClamped) {
    messagePrudence = "L'ajustement a été limité par mesure de sécurité (changement progressif).";
  }

  return {
    analyses,
    rythmeAttenduKgParSemaine,
    ajustementCaloriesPropose,
    nouvellesCaloriesCibles,
    conseilSportif,
    messagePrudence,
  };
}
