import { useLocalStorage } from './useLocalStorage';
import {
  STORAGE_KEYS,
  ALL_STORAGE_KEYS,
  buildDemoProfile,
  buildDemoMeals,
  buildDemoActivities,
  buildDemoWeights,
  buildDemoCompletedSessions,
  buildDemoScheduledSessions,
} from '../utils/storage';
import type {
  UserProfile,
  MealEntry,
  ActivityLog,
  WeightEntry,
  CompletedSession,
  ScheduledSession,
} from '../types';

/** Expose toutes les données persistées de l'application ainsi que leurs setters.
 * Au tout premier lancement, l'application démarre vide : c'est l'écran d'onboarding
 * (voir Onboarding.tsx) qui guide la création du profil, avec un raccourci optionnel
 * pour charger des données de démonstration via loadDemoData(). */
export function useAppData() {
  const [profile, setProfile] = useLocalStorage<UserProfile | null>(STORAGE_KEYS.profile, null);
  const [meals, setMeals] = useLocalStorage<MealEntry[]>(STORAGE_KEYS.meals, []);
  const [activities, setActivities] = useLocalStorage<ActivityLog[]>(STORAGE_KEYS.activities, []);
  const [weights, setWeights] = useLocalStorage<WeightEntry[]>(STORAGE_KEYS.weights, []);
  const [completedSessions, setCompletedSessions] = useLocalStorage<CompletedSession[]>(
    STORAGE_KEYS.completedSessions,
    []
  );
  const [scheduledSessions, setScheduledSessions] = useLocalStorage<ScheduledSession[]>(
    STORAGE_KEYS.scheduledSessions,
    []
  );
  const [programId, setProgramId] = useLocalStorage<string | null>(STORAGE_KEYS.programId, null);
  const [favorites, setFavorites] = useLocalStorage<string[]>(STORAGE_KEYS.favorites, []);

  function resetAllData() {
    ALL_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    setProfile(null);
    setMeals([]);
    setActivities([]);
    setWeights([]);
    setCompletedSessions([]);
    setScheduledSessions([]);
    setProgramId(null);
    setFavorites([]);
  }

  /** Charge en un clic un jeu de données de démonstration complet (profil fictif "Alex"
   * + repas/activités/pesées d'exemple), pour découvrir l'app sans tout saisir à la main. */
  function loadDemoData() {
    setProfile(buildDemoProfile());
    setMeals(buildDemoMeals());
    setActivities(buildDemoActivities());
    setWeights(buildDemoWeights());
    setCompletedSessions(buildDemoCompletedSessions());
    setScheduledSessions(buildDemoScheduledSessions());
  }

  function toggleFavorite(foodId: string) {
    setFavorites((prev) => (prev.includes(foodId) ? prev.filter((id) => id !== foodId) : [...prev, foodId]));
  }

  function addScheduledSession(session: Omit<ScheduledSession, 'id'>) {
    setScheduledSessions((prev) => [...prev, { ...session, id: crypto.randomUUID() }]);
  }

  function updateScheduledSession(id: string, session: Omit<ScheduledSession, 'id'>) {
    setScheduledSessions((prev) => prev.map((s) => (s.id === id ? { ...session, id } : s)));
  }

  function deleteScheduledSession(id: string) {
    setScheduledSessions((prev) => prev.filter((s) => s.id !== id));
  }

  return {
    profile,
    setProfile,
    meals,
    setMeals,
    activities,
    setActivities,
    weights,
    setWeights,
    completedSessions,
    setCompletedSessions,
    scheduledSessions,
    setScheduledSessions,
    addScheduledSession,
    updateScheduledSession,
    deleteScheduledSession,
    programId,
    setProgramId,
    favorites,
    toggleFavorite,
    loadDemoData,
    resetAllData,
  };
}
