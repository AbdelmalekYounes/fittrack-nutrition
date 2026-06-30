import type { UserProfile, TypeActivite, Intensite, Objectif, Recipe } from '../types';
import { calculateCaloriesBurned } from './calculations';
import { recommendRecoveryRecipe } from './recipes';

export interface CardioProgramTemplate {
  id: string;
  nom: string;
  typeActivite: TypeActivite;
  seancesParSemaine: number;
  dureeMinutes: number;
  intensite: Intensite;
  distanceKm?: number;
  objectifConseille: Objectif[];
  conseils: string;
}

export interface CardioProgramResolved extends CardioProgramTemplate {
  caloriesParSeance: number;
  caloriesParSemaine: number;
  recetteRecuperation: Recipe | null;
}

// Plans hebdomadaires pour les activités physiques en dehors de la salle de musculation.
// Les valeurs de durée/distance par défaut reflètent une pratique courante (ex. Padel en
// 1h niveau débutant, EVA Esport Virtual Arena ~3,5 km fractionnés en sprints courts).
const CARDIO_PROGRAM_TEMPLATES: CardioProgramTemplate[] = [
  {
    id: 'padel-loisir',
    nom: 'Padel — loisir',
    typeActivite: 'padel',
    seancesParSemaine: 1,
    dureeMinutes: 60,
    intensite: 'faible',
    objectifConseille: ['perte_de_poids', 'maintien', 'recomposition_corporelle'],
    conseils: "Séance de 1h niveau débutant : échauffement articulaire 5 min, jeu en double pour multiplier les échanges, hydratation entre chaque set.",
  },
  {
    id: 'course-endurance',
    nom: 'Course à pied — endurance fondamentale',
    typeActivite: 'course',
    seancesParSemaine: 2,
    dureeMinutes: 30,
    intensite: 'moyenne',
    distanceKm: 5,
    objectifConseille: ['perte_de_poids', 'maintien', 'renforcement_musculaire'],
    conseils: 'Allure conversationnelle (vous devez pouvoir parler en courant). Augmentez la distance de 10% par semaine maximum.',
  },
  {
    id: 'velo-cardio',
    nom: 'Vélo — sortie cardio',
    typeActivite: 'velo',
    seancesParSemaine: 1,
    dureeMinutes: 45,
    intensite: 'moyenne',
    distanceKm: 15,
    objectifConseille: ['perte_de_poids', 'maintien'],
    conseils: 'Cadence régulière autour de 80-90 tr/min. Idéal en complément des séances de musculation pour la récupération active.',
  },
  {
    id: 'eva-esport-arena',
    nom: 'EVA Esport Virtual Arena — sprints fractionnés',
    typeActivite: 'eva_esport',
    seancesParSemaine: 2,
    dureeMinutes: 40,
    intensite: 'elevee',
    distanceKm: 3.5,
    objectifConseille: ['perte_de_poids', 'renforcement_musculaire', 'recomposition_corporelle'],
    conseils: "Environ 3,5 km parcourus par session, fractionnés en sprints courts. Prévoir des phases de récupération active entre les sprints et bien s'échauffer (chevilles/genoux sollicités par les changements de direction).",
  },
  {
    id: 'natation-endurance',
    nom: 'Natation — endurance',
    typeActivite: 'natation',
    seancesParSemaine: 1,
    dureeMinutes: 40,
    intensite: 'moyenne',
    distanceKm: 1.5,
    objectifConseille: ['maintien', 'renforcement_musculaire', 'recomposition_corporelle'],
    conseils: 'Travail à faible impact articulaire, idéal en complément ou en récupération active après des séances de musculation intenses.',
  },
];

/** Résout les programmes cardio/autres sports pertinents pour le profil (objectif compatible),
 * avec calories estimées par séance/semaine et une recette de récupération riche en protéines. */
export function getCardioPrograms(profile: UserProfile, recipes: Recipe[]): CardioProgramResolved[] {
  return CARDIO_PROGRAM_TEMPLATES.filter((t) => t.objectifConseille.includes(profile.objectif)).map(
    (template) => {
      const caloriesParSeance = calculateCaloriesBurned(
        template.typeActivite,
        template.intensite,
        template.dureeMinutes,
        profile.poidsActuel,
        template.distanceKm
      );
      const recetteRecuperation = recommendRecoveryRecipe(recipes, {
        preferencesAlimentaires: profile.preferencesAlimentaires,
        allergies: profile.allergies,
      });
      return {
        ...template,
        caloriesParSeance,
        caloriesParSemaine: caloriesParSeance * template.seancesParSemaine,
        recetteRecuperation,
      };
    }
  );
}
