// Listes d'options partagées entre la page Profil et l'onboarding, pour éviter la duplication.
import type {
  Materiel,
  PreferenceAlimentaire,
  Objectif,
  NiveauSportif,
  NiveauActivite,
} from '../types';

export const MATERIEL_OPTIONS: { value: Materiel; label: string }[] = [
  { value: 'aucun', label: 'Aucun (poids du corps)' },
  { value: 'halteres', label: 'Haltères' },
  { value: 'elastiques', label: 'Élastiques' },
  { value: 'salle_de_sport', label: 'Salle de sport' },
  { value: 'velo', label: 'Vélo' },
  { value: 'tapis_de_course', label: 'Tapis de course' },
];

export const PREFERENCE_OPTIONS: { value: PreferenceAlimentaire; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'halal', label: 'Halal' },
  { value: 'vegetarien', label: 'Végétarien' },
  { value: 'sans_lactose', label: 'Sans lactose' },
  { value: 'sans_gluten', label: 'Sans gluten' },
];

export const OBJECTIF_OPTIONS: { value: Objectif; label: string; description: string }[] = [
  { value: 'perte_de_poids', label: 'Perte de poids', description: 'Déficit calorique progressif et raisonnable' },
  { value: 'renforcement_musculaire', label: 'Renforcement musculaire', description: 'Gagner en force sans viser la prise de masse' },
  { value: 'prise_de_muscle', label: 'Prise de muscle', description: 'Surplus calorique et volume d\'entraînement élevé' },
  { value: 'maintien', label: 'Maintien', description: 'Stabiliser votre poids et vos habitudes actuelles' },
  { value: 'recomposition_corporelle', label: 'Recomposition corporelle', description: 'Perdre du gras tout en préservant le muscle' },
];

export const NIVEAU_SPORTIF_OPTIONS: { value: NiveauSportif; label: string }[] = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
];

export const NIVEAU_ACTIVITE_OPTIONS: { value: NiveauActivite; label: string }[] = [
  { value: 'sedentaire', label: 'Sédentaire (peu ou pas d\'exercice)' },
  { value: 'leger', label: 'Légèrement actif (1-3 jours/semaine)' },
  { value: 'modere', label: 'Modérément actif (3-5 jours/semaine)' },
  { value: 'actif', label: 'Actif (6-7 jours/semaine)' },
  { value: 'tres_actif', label: 'Très actif (travail physique + sport)' },
];

export function emptyProfile() {
  return {
    prenom: '',
    sexe: 'homme' as const,
    age: 25,
    tailleCm: 170,
    poidsActuel: 70,
    poidsCible: 70,
    niveauSportif: 'debutant' as const,
    objectif: 'maintien' as const,
    seancesParSemaine: 3,
    dureeSeanceMinutes: 45,
    materielDisponible: [] as Materiel[],
    preferencesAlimentaires: ['normal'] as PreferenceAlimentaire[],
    allergies: [] as string[],
    niveauActivite: 'modere' as const,
  };
}
