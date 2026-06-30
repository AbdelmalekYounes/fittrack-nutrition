import type { UserProfile, MealEntry, ActivityLog, WeightEntry, NutritionTargets, StagnationIssue, StagnationReport } from '../types';
import { calculateTDEE, calculateBMR } from './calculations';
import { periodRate, averageCalories, ABSOLUTE_FLOOR } from './adjustmentEngine';
import { addDays, todayISO } from './date';

/** Analyse une fenêtre de N jours et détecte les points de vigilance (stagnation, déficit
 * insuffisant/trop agressif, protéines basses, activité insuffisante, manque de régularité).
 * Recommandations toujours bornées à des valeurs sûres — jamais d'ajustement dangereux. */
export function analyzeStagnation(
  profile: UserProfile,
  targets: NutritionTargets,
  meals: MealEntry[],
  activities: ActivityLog[],
  weights: WeightEntry[],
  windowDays: 14 | 30
): StagnationIssue[] {
  const today = todayISO();
  const from = addDays(today, -(windowDays - 1));

  const periodMeals = meals.filter((m) => m.date >= from && m.date <= today);
  const periodActivities = activities.filter((a) => a.date >= from && a.date <= today);
  const periodWeights = weights.filter((w) => w.date >= from && w.date <= today);

  const daysWithMeals = new Set(periodMeals.map((m) => m.date)).size;
  const regularitePourcent = Math.round((daysWithMeals / windowDays) * 100);

  // Données insuffisantes : on s'arrête là plutôt que de tirer des conclusions hasardeuses.
  if (daysWithMeals < windowDays * 0.3 || periodWeights.length < 2) {
    return [
      {
        type: 'donnees_insuffisantes',
        gravite: 'info',
        message: `Pas assez de données enregistrées sur les ${windowDays} derniers jours pour une analyse fiable.`,
        recommandation: 'Continuez à enregistrer vos repas et au moins une pesée par semaine ; revenez dans quelques jours pour une analyse complète.',
      },
    ];
  }

  const issues: StagnationIssue[] = [];
  const moyenneCalories = averageCalories(periodMeals, from, today);
  const moyenneProteines = Math.round(
    periodMeals.reduce((sum, m) => sum + m.proteines, 0) / Math.max(1, daysWithMeals)
  );
  const rythme = periodRate(weights, from, today);
  const tdee = calculateTDEE(profile);
  const floor = Math.max(calculateBMR(profile), ABSOLUTE_FLOOR[profile.sexe]);
  const seancesAttendues = Math.round((profile.seancesParSemaine * windowDays) / 7);

  // 1. Stagnation du poids malgré un objectif qui implique un changement.
  const objectifAttendVariation = profile.objectif !== 'maintien' && profile.objectif !== 'renforcement_musculaire';
  if (rythme !== null && Math.abs(rythme) < 0.1 && objectifAttendVariation) {
    const dansLeBudget = profile.objectif === 'prise_de_muscle' ? moyenneCalories <= tdee * 1.05 : moyenneCalories >= tdee * 0.95;
    issues.push({
      type: 'stagnation_poids',
      gravite: 'attention',
      message: `Votre poids stagne depuis ${windowDays} jours malgré un objectif de ${profile.objectif.replace(/_/g, ' ')}.`,
      recommandation: dansLeBudget
        ? "Vos apports caloriques sont proches de votre dépense : un léger ajustement (~150 kcal/jour) ou quelques pas supplémentaires par jour peuvent relancer la progression."
        : 'Vérifiez la régularité de vos pesées (même heure, mêmes conditions) — le déficit/surplus semble présent sur le papier, patientez encore une semaine avant d\'ajuster.',
    });
  }

  // 2. Déficit insuffisant (perte de poids visée mais calories trop proches du maintien).
  if (profile.objectif === 'perte_de_poids' && moyenneCalories >= tdee * 0.98) {
    issues.push({
      type: 'deficit_insuffisant',
      gravite: 'attention',
      message: 'Vos apports caloriques moyens sont proches de votre dépense énergétique : le déficit nécessaire à la perte de poids est faible voire inexistant.',
      recommandation: 'Réduisez légèrement les calories (~150 kcal/jour) ou augmentez votre activité quotidienne (plus de pas, une séance supplémentaire).',
    });
  }

  // 3. Déficit trop agressif (sous le seuil de sécurité).
  if (moyenneCalories > 0 && moyenneCalories < floor) {
    issues.push({
      type: 'deficit_trop_agressif',
      gravite: 'alerte',
      message: `Vos apports caloriques moyens (${moyenneCalories} kcal) sont en dessous du seuil de sécurité recommandé (${Math.round(floor)} kcal).`,
      recommandation: "Augmentez vos calories pour revenir au-dessus du seuil de sécurité — un déficit trop important peut nuire à votre santé et à votre énergie.",
    });
  }

  // 4. Protéines trop basses.
  if (moyenneProteines < targets.proteines * 0.8) {
    issues.push({
      type: 'proteines_basses',
      gravite: 'attention',
      message: `Votre apport moyen en protéines (${moyenneProteines}g) est nettement en dessous de votre objectif (${Math.round(targets.proteines)}g).`,
      recommandation: 'Augmentez vos apports en protéines : viandes maigres, poisson, œufs, légumineuses ou produits laitiers à chaque repas.',
    });
  }

  // 5. Activité insuffisante par rapport à l'objectif hebdomadaire de séances.
  if (periodActivities.length < seancesAttendues * 0.6) {
    issues.push({
      type: 'activite_insuffisante',
      gravite: 'attention',
      message: `${periodActivities.length} séance(s) réalisée(s) sur ${windowDays} jours, pour un objectif théorique d'environ ${seancesAttendues}.`,
      recommandation: 'Ajoutez une séance supplémentaire la semaine prochaine, ou augmentez votre activité quotidienne (marche, escaliers, etc.).',
    });
  }

  // 6. Manque de régularité du suivi alimentaire.
  if (regularitePourcent < 50) {
    issues.push({
      type: 'regularite_faible',
      gravite: 'attention',
      message: `Seulement ${regularitePourcent}% des jours ont au moins un repas enregistré sur cette période.`,
      recommandation: 'Essayez d\'enregistrer vos repas plus régulièrement, même rapidement (favoris, ajout vocal, scanner) — la régularité du suivi est ce qui rend les analyses fiables.',
    });
  }

  if (issues.length === 0) {
    issues.push({
      type: 'objectif_respecte',
      gravite: 'info',
      message: `Sur les ${windowDays} derniers jours, vos données sont cohérentes avec votre objectif.`,
      recommandation: 'Maintenez votre plan actuel : alimentation, activité et régularité sont sur la bonne voie.',
    });
  }

  return issues;
}

export function buildStagnationReport(
  profile: UserProfile,
  targets: NutritionTargets,
  meals: MealEntry[],
  activities: ActivityLog[],
  weights: WeightEntry[]
): StagnationReport {
  return {
    analyses14j: analyzeStagnation(profile, targets, meals, activities, weights, 14),
    analyses30j: analyzeStagnation(profile, targets, meals, activities, weights, 30),
  };
}
