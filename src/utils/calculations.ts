// Toutes les formules de ce fichier sont des ESTIMATIONS basées sur des équations
// nutritionnelles standards (Mifflin-St Jeor, facteurs d'activité, MET). Elles ne
// remplacent en aucun cas un avis médical, diététique ou sportif professionnel.

import type {
  UserProfile,
  NutritionTargets,
  TypeActivite,
  Intensite,
} from '../types';

const ACTIVITY_MULTIPLIERS: Record<UserProfile['niveauActivite'], number> = {
  sedentaire: 1.2,
  leger: 1.375,
  modere: 1.55,
  actif: 1.725,
  tres_actif: 1.9,
};

const PROTEIN_PER_KG: Record<UserProfile['objectif'], number> = {
  perte_de_poids: 2.0,
  prise_de_muscle: 1.8,
  recomposition_corporelle: 2.2,
  renforcement_musculaire: 1.8,
  maintien: 1.6,
};

/** Métabolisme de base (Mifflin-St Jeor). */
export function calculateBMR(profile: UserProfile): number {
  const base = 10 * profile.poidsActuel + 6.25 * profile.tailleCm - 5 * profile.age;
  return profile.sexe === 'homme' ? base + 5 : base - 161;
}

/** Dépense énergétique journalière totale = BMR * facteur d'activité. */
export function calculateTDEE(profile: UserProfile): number {
  return calculateBMR(profile) * ACTIVITY_MULTIPLIERS[profile.niveauActivite];
}

/** Calories cibles ajustées selon l'objectif (déficit / surplus / maintien). */
export function calculateTargetCalories(profile: UserProfile): number {
  const tdee = calculateTDEE(profile);
  switch (profile.objectif) {
    case 'perte_de_poids':
      return tdee * 0.85;
    case 'prise_de_muscle':
      return tdee * 1.1;
    case 'recomposition_corporelle':
      return tdee * 0.95;
    case 'renforcement_musculaire':
    case 'maintien':
    default:
      return tdee;
  }
}

/** Calcule les cibles nutritionnelles journalières complètes du profil. */
export function calculateNutritionTargets(profile: UserProfile): NutritionTargets {
  const calories = calculateTargetCalories(profile);
  const proteines = PROTEIN_PER_KG[profile.objectif] * profile.poidsActuel;
  const lipides = (calories * 0.28) / 9;
  const glucides = Math.max(0, (calories - proteines * 4 - lipides * 9) / 4);
  const eau = 35 * profile.poidsActuel + (profile.seancesParSemaine >= 4 ? 500 : 0);

  return {
    calories: Math.round(calories),
    proteines: Math.round(proteines),
    glucides: Math.round(glucides),
    lipides: Math.round(lipides),
    eau: Math.round(eau),
  };
}

// Table de MET (Metabolic Equivalent of Task) approximative par type d'activité.
// eva_esport (Esport Virtual Arena) correspond à une activité de déplacement physique
// réel (pas un esport assis) : le MET reflète une marche/course fractionnée en sprints.
const MET_TABLE: Record<TypeActivite, number> = {
  musculation: 5,
  course: 9.8,
  velo: 7,
  marche: 3.5,
  natation: 6,
  football: 7,
  boxe: 9,
  hiit: 8,
  padel: 6,
  eva_esport: 7,
  autre: 5,
};

const INTENSITY_MULTIPLIER: Record<Intensite, number> = {
  faible: 0.8,
  moyenne: 1.0,
  elevee: 1.2,
};

// Coefficient kcal/kg/km pour les activités où la distance parcourue donne une estimation
// plus fiable que la durée seule. eva_esport est plus coûteux qu'une course continue à
// distance égale car les sprints fractionnés impliquent des accélérations/décélérations
// répétées (changements de direction typiques d'une arène esport physique).
const DISTANCE_KCAL_PER_KG_PER_KM: Partial<Record<TypeActivite, number>> = {
  course: 1.0,
  marche: 0.5,
  velo: 0.35,
  natation: 1.4,
  eva_esport: 1.15,
};

/**
 * Calories brûlées, estimation indicative.
 * Si une distance est fournie pour une activité qui s'y prête (course, marche, vélo, EVA
 * Esport...), on calcule via un coefficient kcal/kg/km, plus précis que la seule durée.
 * Sinon : MET ajusté à l'intensité * poids(kg) * durée(heures).
 */
export function calculateCaloriesBurned(
  typeActivite: TypeActivite,
  intensite: Intensite,
  dureeMinutes: number,
  poidsKg: number,
  distanceKm?: number
): number {
  const distanceCoeff = DISTANCE_KCAL_PER_KG_PER_KM[typeActivite];
  if (distanceKm && distanceKm > 0 && distanceCoeff) {
    return Math.round(distanceCoeff * poidsKg * distanceKm);
  }
  const met = MET_TABLE[typeActivite] * INTENSITY_MULTIPLIER[intensite];
  return Math.round(met * poidsKg * (dureeMinutes / 60));
}
