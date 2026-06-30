// Types métier centraux de l'application FitTrack Nutrition.

export type Sexe = 'homme' | 'femme';

export type NiveauSportif = 'debutant' | 'intermediaire' | 'avance';

export type Objectif =
  | 'perte_de_poids'
  | 'renforcement_musculaire'
  | 'prise_de_muscle'
  | 'maintien'
  | 'recomposition_corporelle';

export type Materiel =
  | 'aucun'
  | 'halteres'
  | 'elastiques'
  | 'salle_de_sport'
  | 'velo'
  | 'tapis_de_course';

export type PreferenceAlimentaire =
  | 'normal'
  | 'halal'
  | 'vegetarien'
  | 'sans_lactose'
  | 'sans_gluten';

export type NiveauActivite =
  | 'sedentaire'
  | 'leger'
  | 'modere'
  | 'actif'
  | 'tres_actif';

export interface UserProfile {
  prenom: string;
  sexe: Sexe;
  age: number;
  tailleCm: number;
  poidsActuel: number;
  poidsCible: number;
  niveauSportif: NiveauSportif;
  objectif: Objectif;
  seancesParSemaine: number;
  dureeSeanceMinutes: number;
  materielDisponible: Materiel[];
  preferencesAlimentaires: PreferenceAlimentaire[];
  allergies: string[];
  niveauActivite: NiveauActivite;
}

export interface NutritionTargets {
  calories: number;
  proteines: number;
  glucides: number;
  lipides: number;
  eau: number;
}

export interface FoodItem {
  id: string;
  nom: string;
  caloriesPour100g: number;
  proteinesPour100g: number;
  glucidesPour100g: number;
  lipidesPour100g: number;
  fibresPour100g: number;
  // Champs optionnels enrichis (produits scannés via OpenFoodFacts ou ajoutés manuellement) :
  // restent rétrocompatibles avec les aliments de la base locale qui ne les renseignent pas.
  selPour100g?: number;
  nutriScore?: string; // 'a' | 'b' | 'c' | 'd' | 'e'
  allergenes?: string[];
  ingredientsTexte?: string;
  source?: 'local' | 'openfoodfacts' | 'personnalise';
  codeBarres?: string;
}

export type TypeRepas = 'petit_dejeuner' | 'dejeuner' | 'diner' | 'collation';

export interface MealEntry {
  id: string;
  date: string; // ISO yyyy-mm-dd
  typeRepas: TypeRepas;
  nom: string;
  quantiteGrammes: number;
  calories: number;
  proteines: number;
  glucides: number;
  lipides: number;
  fibres: number;
}

export interface Recipe {
  id: string;
  nom: string;
  typeRepas: TypeRepas;
  tempsPreparationMinutes: number;
  calories: number;
  proteines: number;
  glucides: number;
  lipides: number;
  ingredients: string[];
  etapes: string[];
  objectifConseille: Objectif[];
  preferencesCompatibles: PreferenceAlimentaire[];
}

export type TypeActivite =
  | 'musculation'
  | 'course'
  | 'velo'
  | 'marche'
  | 'natation'
  | 'football'
  | 'boxe'
  | 'hiit'
  | 'padel'
  | 'eva_esport'
  | 'autre';

export type Intensite = 'faible' | 'moyenne' | 'elevee';

export interface ActivityLog {
  id: string;
  date: string;
  typeActivite: TypeActivite;
  dureeMinutes: number;
  intensite: Intensite;
  caloriesBrulees: number;
  notes: string;
  exercicesRealises: string[];
  ressenti: string;
  distanceKm?: number; // utilisé pour un calcul de calories plus précis (course, vélo, marche, EVA Esport)
}

export interface WeightEntry {
  id: string;
  date: string;
  poids: number;
  tourDeTailleCm?: number;
  note?: string;
}

export interface Exercise {
  id: string;
  nom: string;
  materiel: Materiel[];
  groupeMusculaire: string;
  instructions: string;
  // Champs enrichis de la bibliothèque d'exercices — optionnels pour rester
  // rétrocompatible si un exercice n'a pas encore été complété.
  niveau?: NiveauSportif[];
  erreursFrequentes?: string[];
  varianteFacile?: string;
  varianteDifficile?: string;
  conseilsSecurite?: string;
}

export interface WorkoutExercise {
  exerciceId: string;
  series: number;
  repetitions: string;
  tempsReposSecondes: number;
}

export interface WorkoutSessionTemplate {
  id: string;
  nom: string;
  exercices: WorkoutExercise[];
  conseils: string;
}

export interface WorkoutProgram {
  id: string;
  nom: string;
  objectif: Objectif;
  niveau: NiveauSportif;
  nombreSemaines: number;
  seancesParSemaine: number;
  seances: WorkoutSessionTemplate[];
  progressionRecommandee: string;
}

export interface CompletedSession {
  id: string;
  programId: string;
  seanceId: string;
  date: string;
}

export interface ScheduledSession {
  id: string;
  date: string; // ISO yyyy-mm-dd
  heureDebut: string; // HH:mm
  heureFin: string; // HH:mm
  typeActivite: TypeActivite;
  titre?: string;
  notes?: string;
  adversaire?: string; // utilisé notamment pour les séances EVA Esport Virtual Arena
}

/** Un jour du plan alimentaire hebdomadaire : un id de recette par type de repas. */
export interface MealPlanDay {
  date: string;
  recettes: Record<TypeRepas, string>;
}

export interface WeeklyMealPlan {
  id: string;
  semaineDebut: string; // lundi de la semaine, ISO
  jours: MealPlanDay[];
  genereLe: string; // horodatage ISO de génération
}

/** Bilan hebdomadaire calculé automatiquement (voir utils/weeklyReport.ts). */
export interface WeeklyReport {
  semaineDebut: string;
  semaineFin: string;
  poidsMoyen: number | null;
  evolutionPoidsKg: number | null;
  moyenneCalories: number;
  moyenneProteines: number;
  seancesRealisees: number;
  caloriesBrulees: number;
  regularitePourcent: number; // % de jours avec au moins un repas enregistré
  pointsForts: string[];
  pointsAmeliorer: string[];
  conseilSemaineSuivante: string;
}

/** Analyse d'une fenêtre temporelle (7/14/30 jours) pour le moteur d'ajustement. */
export interface PeriodAnalysis {
  jours: 7 | 14 | 30;
  moyenneCalories: number;
  rythmePoidsKgParSemaine: number | null;
}

/** Suggestion d'ajustement automatique (voir utils/adjustmentEngine.ts). Toujours
 * bornée à des valeurs sûres et présentée comme une estimation, pas un avis médical. */
export interface AdjustmentSuggestion {
  analyses: PeriodAnalysis[];
  rythmeAttenduKgParSemaine: number;
  ajustementCaloriesPropose: number; // delta en kcal/jour, borné
  nouvellesCaloriesCibles: number;
  conseilSportif: string;
  messagePrudence?: string;
}

/** Avertissement de sécurité sur le profil/objectif (voir utils/safetyCheck.ts). */
export interface SafetyWarning {
  niveau: 'attention' | 'alerte';
  message: string;
}

/** Saisie quotidienne de récupération (voir utils/recoveryScore.ts). Échelles 1 (faible) à 5 (élevée),
 * sauf fatigue/courbatures/stress où 5 = niveau élevé de la gêne (donc défavorable au score). */
export interface RecoveryEntry {
  id: string;
  date: string; // ISO yyyy-mm-dd, une saisie par jour
  heuresSommeil: number;
  qualiteSommeil: number; // 1-5
  fatigue: number; // 1-5 (5 = très fatigué)
  courbatures: number; // 1-5 (5 = très courbaturé)
  stress: number; // 1-5 (5 = très stressé)
  motivation: number; // 1-5
  faim: number; // 1-5
  douleur?: string;
}

export type DifficulteRessentie = 'tres_facile' | 'facile' | 'normale' | 'difficile' | 'echec';

/** Une série réalisée pour un exercice donné (voir Mode séance en direct). */
export interface SerieRealisee {
  repetitions: number;
  chargeKg?: number;
}

/** Historique de performance pour un exercice précis, utilisé pour la progression automatique
 * (voir utils/exerciseProgression.ts). Alimenté principalement par le mode séance en direct. */
export interface ExerciseLog {
  id: string;
  exerciceId: string;
  date: string;
  series: SerieRealisee[];
  difficulte: DifficulteRessentie;
  notes?: string;
}

/** Un point de vigilance ou recommandation détecté par le coach anti-stagnation
 * (voir utils/stagnationCoach.ts). Recommandations toujours bornées à des valeurs sûres. */
export interface StagnationIssue {
  type:
    | 'stagnation_poids'
    | 'deficit_insuffisant'
    | 'deficit_trop_agressif'
    | 'proteines_basses'
    | 'activite_insuffisante'
    | 'regularite_faible'
    | 'donnees_insuffisantes'
    | 'objectif_respecte';
  gravite: 'info' | 'attention' | 'alerte';
  message: string;
  recommandation: string;
}

export interface StagnationReport {
  analyses14j: StagnationIssue[];
  analyses30j: StagnationIssue[];
}
