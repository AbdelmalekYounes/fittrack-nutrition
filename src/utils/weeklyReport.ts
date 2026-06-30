import type { UserProfile, MealEntry, ActivityLog, WeightEntry, NutritionTargets, WeeklyReport } from '../types';
import { addDays } from './date';

interface BuildWeeklyReportParams {
  profile: UserProfile;
  targets: NutritionTargets;
  meals: MealEntry[];
  activities: ActivityLog[];
  weights: WeightEntry[];
  weekStart: string; // lundi de la semaine, ISO
}

/** Calcule le bilan hebdomadaire automatique : moyennes, régularité, et conseils textuels
 * générés par des règles simples (pas d'IA/API externe) à partir des données de la semaine. */
export function buildWeeklyReport({
  profile,
  targets,
  meals,
  activities,
  weights,
  weekStart,
}: BuildWeeklyReportParams): WeeklyReport {
  const weekEnd = addDays(weekStart, 6);
  const inWeek = (date: string) => date >= weekStart && date <= weekEnd;

  const weekMeals = meals.filter((m) => inWeek(m.date));
  const weekActivities = activities.filter((a) => inWeek(a.date));
  const weekWeights = [...weights].filter((w) => inWeek(w.date)).sort((a, b) => a.date.localeCompare(b.date));

  const daysWithMeals = new Set(weekMeals.map((m) => m.date)).size;
  const regularitePourcent = Math.round((daysWithMeals / 7) * 100);

  const totalCalories = weekMeals.reduce((sum, m) => sum + m.calories, 0);
  const totalProteines = weekMeals.reduce((sum, m) => sum + m.proteines, 0);
  const moyenneCalories = daysWithMeals > 0 ? Math.round(totalCalories / daysWithMeals) : 0;
  const moyenneProteines = daysWithMeals > 0 ? Math.round(totalProteines / daysWithMeals) : 0;

  const poidsMoyen =
    weekWeights.length > 0
      ? Math.round((weekWeights.reduce((sum, w) => sum + w.poids, 0) / weekWeights.length) * 10) / 10
      : null;
  const evolutionPoidsKg =
    weekWeights.length >= 2
      ? Math.round((weekWeights[weekWeights.length - 1].poids - weekWeights[0].poids) * 10) / 10
      : null;

  const seancesRealisees = weekActivities.length;
  const caloriesBrulees = weekActivities.reduce((sum, a) => sum + a.caloriesBrulees, 0);

  const pointsForts: string[] = [];
  const pointsAmeliorer: string[] = [];

  if (regularitePourcent >= 70) {
    pointsForts.push(`Suivi nutritionnel régulier (${daysWithMeals}/7 jours enregistrés).`);
  } else {
    pointsAmeliorer.push('Suivi nutritionnel irrégulier : essayez de noter vos repas chaque jour.');
  }

  if (seancesRealisees >= profile.seancesParSemaine) {
    pointsForts.push(`Objectif de ${profile.seancesParSemaine} séance(s) hebdomadaire atteint (${seancesRealisees}).`);
  } else {
    const manquantes = profile.seancesParSemaine - seancesRealisees;
    pointsAmeliorer.push(`Il manque ${manquantes} séance(s) pour atteindre votre objectif de ${profile.seancesParSemaine}/semaine.`);
  }

  if (daysWithMeals > 0 && moyenneProteines >= targets.proteines * 0.9) {
    pointsForts.push('Apport en protéines proche ou conforme à votre objectif.');
  } else if (daysWithMeals > 0) {
    pointsAmeliorer.push('Apport en protéines en dessous de votre objectif sur la semaine.');
  }

  if (weekWeights.length === 0) {
    pointsAmeliorer.push('Aucune pesée enregistrée cette semaine.');
  } else if (evolutionPoidsKg !== null) {
    const objectifPerte = profile.objectif === 'perte_de_poids' || profile.objectif === 'recomposition_corporelle';
    const objectifPrise = profile.objectif === 'prise_de_muscle';
    const coherent = (objectifPerte && evolutionPoidsKg <= 0) || (objectifPrise && evolutionPoidsKg >= 0);
    if (coherent) {
      pointsForts.push('Évolution du poids cohérente avec votre objectif.');
    }
  }

  if (pointsForts.length === 0) {
    pointsForts.push('Vous avez commencé à enregistrer vos données : continuez pour des bilans plus précis.');
  }

  let conseilSemaineSuivante: string;
  if (regularitePourcent < 50) {
    conseilSemaineSuivante = "Priorité n°1 : enregistrez vos repas plus régulièrement, même rapidement, pour fiabiliser vos bilans.";
  } else if (seancesRealisees < profile.seancesParSemaine) {
    conseilSemaineSuivante = 'Planifiez vos séances à l\'avance dans le calendrier pour ne pas les manquer la semaine prochaine.';
  } else if (weekWeights.length === 0) {
    conseilSemaineSuivante = 'Pensez à enregistrer au moins une pesée par semaine pour suivre votre évolution.';
  } else {
    conseilSemaineSuivante = 'Continuez sur cette lancée : votre régularité est le principal facteur de progression.';
  }

  return {
    semaineDebut: weekStart,
    semaineFin: weekEnd,
    poidsMoyen,
    evolutionPoidsKg,
    moyenneCalories,
    moyenneProteines,
    seancesRealisees,
    caloriesBrulees,
    regularitePourcent,
    pointsForts,
    pointsAmeliorer,
    conseilSemaineSuivante,
  };
}
