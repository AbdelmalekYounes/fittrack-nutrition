// Clés localStorage centralisées + données de démo affichées au tout premier lancement.

import type {
  UserProfile,
  MealEntry,
  ActivityLog,
  WeightEntry,
  CompletedSession,
  ScheduledSession,
} from '../types';
import { addDays, todayISO } from './date';

export const STORAGE_KEYS = {
  profile: 'fittrack:profile',
  meals: 'fittrack:meals',
  activities: 'fittrack:activities',
  weights: 'fittrack:weights',
  completedSessions: 'fittrack:completedSessions',
  scheduledSessions: 'fittrack:scheduledSessions',
  programId: 'fittrack:programId',
  favorites: 'fittrack:favorites',
  mealPlan: 'fittrack:mealPlan',
  customFoods: 'fittrack:customFoods',
  recoveryEntries: 'fittrack:recoveryEntries',
  exerciseLogs: 'fittrack:exerciseLogs',
  initialized: 'fittrack:initialized',
} as const;

export const ALL_STORAGE_KEYS = Object.values(STORAGE_KEYS);

/** Profil de démonstration pré-rempli au premier lancement (l'utilisateur peut le réinitialiser). */
export function buildDemoProfile(): UserProfile {
  return {
    prenom: 'Alex',
    sexe: 'homme',
    age: 30,
    tailleCm: 175,
    poidsActuel: 78,
    poidsCible: 72,
    niveauSportif: 'intermediaire',
    objectif: 'perte_de_poids',
    seancesParSemaine: 4,
    dureeSeanceMinutes: 45,
    materielDisponible: ['halteres', 'aucun'],
    preferencesAlimentaires: ['normal'],
    allergies: [],
    niveauActivite: 'modere',
  };
}

export function buildDemoMeals(): MealEntry[] {
  const today = todayISO();
  return [
    {
      id: 'demo-meal-1',
      date: today,
      typeRepas: 'petit_dejeuner',
      nom: "Flocons d'avoine",
      quantiteGrammes: 80,
      calories: 311,
      proteines: 13.5,
      glucides: 52.8,
      lipides: 5.5,
      fibres: 8.5,
    },
    {
      id: 'demo-meal-2',
      date: today,
      typeRepas: 'dejeuner',
      nom: 'Blanc de poulet',
      quantiteGrammes: 150,
      calories: 248,
      proteines: 46.5,
      glucides: 0,
      lipides: 5.4,
      fibres: 0,
    },
    {
      id: 'demo-meal-3',
      date: today,
      typeRepas: 'collation',
      nom: 'Pomme',
      quantiteGrammes: 150,
      calories: 78,
      proteines: 0.5,
      glucides: 21,
      lipides: 0.3,
      fibres: 3.6,
    },
  ];
}

export function buildDemoActivities(): ActivityLog[] {
  return [
    {
      id: 'demo-activity-1',
      date: addDays(todayISO(), -2),
      typeActivite: 'musculation',
      dureeMinutes: 50,
      intensite: 'moyenne',
      caloriesBrulees: 325,
      notes: 'Séance haut du corps',
      exercicesRealises: ['Développé épaules haltères', 'Rowing haltère', 'Pompes'],
      ressenti: 'Bonne énergie',
    },
    {
      id: 'demo-activity-2',
      date: addDays(todayISO(), -1),
      typeActivite: 'course',
      dureeMinutes: 30,
      intensite: 'moyenne',
      caloriesBrulees: 382,
      notes: 'Footing en extérieur',
      exercicesRealises: [],
      ressenti: 'Léger essoufflement',
    },
  ];
}

export function buildDemoWeights(): WeightEntry[] {
  return [
    { id: 'demo-weight-1', date: addDays(todayISO(), -21), poids: 80, note: 'Début du suivi' },
    { id: 'demo-weight-2', date: addDays(todayISO(), -14), poids: 79.3 },
    { id: 'demo-weight-3', date: addDays(todayISO(), -7), poids: 78.6 },
    { id: 'demo-weight-4', date: todayISO(), poids: 78 },
  ];
}

export function buildDemoCompletedSessions(): CompletedSession[] {
  return [];
}

export function buildDemoScheduledSessions(): ScheduledSession[] {
  return [
    {
      id: 'demo-scheduled-1',
      date: addDays(todayISO(), 1),
      heureDebut: '18:00',
      heureFin: '19:00',
      typeActivite: 'musculation',
      titre: 'Séance haut du corps',
    },
  ];
}
