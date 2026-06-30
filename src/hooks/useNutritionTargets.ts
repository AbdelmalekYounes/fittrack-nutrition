import { useMemo } from 'react';
import type { UserProfile, NutritionTargets } from '../types';
import { calculateNutritionTargets } from '../utils/calculations';

/** Calcule les cibles nutritionnelles journalières à partir du profil utilisateur. */
export function useNutritionTargets(profile: UserProfile | null): NutritionTargets | null {
  return useMemo(() => {
    if (!profile) return null;
    return calculateNutritionTargets(profile);
  }, [profile]);
}
