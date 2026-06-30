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
