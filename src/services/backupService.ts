// Service de sauvegarde/restauration : transformation pure des données (pas d'accès direct
// au stockage ici). La lecture/écriture réelle passe toujours par useAppData (qui utilise
// storageService) — ce service ne fait que construire/valider la structure du fichier JSON.
import type {
  UserProfile,
  MealEntry,
  ActivityLog,
  WeightEntry,
  CompletedSession,
  ScheduledSession,
  WeeklyMealPlan,
} from '../types';

export interface BackupData {
  profile: UserProfile | null;
  meals: MealEntry[];
  activities: ActivityLog[];
  weights: WeightEntry[];
  completedSessions: CompletedSession[];
  scheduledSessions: ScheduledSession[];
  programId: string | null;
  favorites: string[];
  mealPlan: WeeklyMealPlan | null;
}

export interface BackupFile {
  appVersion: string;
  exportedAt: string;
  data: BackupData;
}

const APP_VERSION = '1.0';
const ARRAY_FIELDS: (keyof BackupData)[] = [
  'meals',
  'activities',
  'weights',
  'completedSessions',
  'scheduledSessions',
  'favorites',
];

export function buildBackupFile(data: BackupData): BackupFile {
  return { appVersion: APP_VERSION, exportedAt: new Date().toISOString(), data };
}

export function serializeBackup(file: BackupFile): string {
  return JSON.stringify(file, null, 2);
}

export function backupFileName(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `fittrack-nutrition-sauvegarde-${date}.json`;
}

type ParseResult = { ok: true; file: BackupFile } | { ok: false; error: string };

/** Valide la structure d'un fichier de sauvegarde importé : protège contre un JSON
 * corrompu, incomplet, ou ne provenant pas de cette application. Aucune valeur n'est
 * appliquée tant que cette validation n'a pas réussi. */
export function parseBackupFile(jsonText: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { ok: false, error: "Le fichier n'est pas un JSON valide." };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'Format de fichier invalide.' };
  }
  const root = parsed as Record<string, unknown>;

  if (typeof root.appVersion !== 'string' || typeof root.exportedAt !== 'string') {
    return { ok: false, error: 'Fichier de sauvegarde non reconnu (métadonnées manquantes).' };
  }

  if (typeof root.data !== 'object' || root.data === null) {
    return { ok: false, error: 'Données de sauvegarde manquantes ou corrompues.' };
  }
  const data = root.data as Record<string, unknown>;

  for (const field of ARRAY_FIELDS) {
    if (!Array.isArray(data[field])) {
      return { ok: false, error: `Le champ « ${field} » est manquant ou invalide dans le fichier.` };
    }
  }
  if (data.profile !== null && typeof data.profile !== 'object') {
    return { ok: false, error: 'Le profil contenu dans le fichier est invalide.' };
  }
  if (data.programId !== undefined && data.programId !== null && typeof data.programId !== 'string') {
    return { ok: false, error: 'Le champ « programId » est invalide.' };
  }
  if (data.mealPlan !== undefined && data.mealPlan !== null && typeof data.mealPlan !== 'object') {
    return { ok: false, error: 'Le plan de repas contenu dans le fichier est invalide.' };
  }

  return { ok: true, file: root as unknown as BackupFile };
}
