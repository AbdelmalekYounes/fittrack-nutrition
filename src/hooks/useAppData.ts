import { useLocalStorage } from './useLocalStorage';
import {
  STORAGE_KEYS,
  ALL_STORAGE_KEYS,
  buildDemoProfile,
  buildDemoMeals,
  buildDemoActivities,
  buildDemoWeights,
  buildDemoCompletedSessions,
} from '../utils/storage';
import type { UserProfile, MealEntry, ActivityLog, WeightEntry, CompletedSession } from '../types';

/** Expose toutes les données persistées de l'application ainsi que leurs setters.
 * Au tout premier lancement (aucune donnée en localStorage), des données de démo
 * sont injectées pour que l'application ne soit pas vide. */
export function useAppData() {
  const [profile, setProfile] = useLocalStorage<UserProfile | null>(
    STORAGE_KEYS.profile,
    () => buildDemoProfile()
  );
  const [meals, setMeals] = useLocalStorage<MealEntry[]>(STORAGE_KEYS.meals, () => buildDemoMeals());
  const [activities, setActivities] = useLocalStorage<ActivityLog[]>(
    STORAGE_KEYS.activities,
    () => buildDemoActivities()
  );
  const [weights, setWeights] = useLocalStorage<WeightEntry[]>(
    STORAGE_KEYS.weights,
    () => buildDemoWeights()
  );
  const [completedSessions, setCompletedSessions] = useLocalStorage<CompletedSession[]>(
    STORAGE_KEYS.completedSessions,
    () => buildDemoCompletedSessions()
  );
  const [programId, setProgramId] = useLocalStorage<string | null>(STORAGE_KEYS.programId, null);

  function resetAllData() {
    ALL_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    setProfile(null);
    setMeals([]);
    setActivities([]);
    setWeights([]);
    setCompletedSessions([]);
    setProgramId(null);
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
    programId,
    setProgramId,
    resetAllData,
  };
}
