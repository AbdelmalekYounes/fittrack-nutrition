import type {
  UserProfile,
  WorkoutProgram,
  WorkoutSessionTemplate,
  WorkoutExercise,
  NiveauSportif,
  Materiel,
} from '../types';
import exercisesData from '../data/exercises.json';
import type { Exercise } from '../types';

const exercises = exercisesData as Exercise[];

function findExercise(id: string): Exercise | undefined {
  return exercises.find((e) => e.id === id);
}

export function getExerciseName(id: string): string {
  return findExercise(id)?.nom ?? id;
}

// Paramètres séries/répétitions/repos qui varient selon le niveau : un débutant fait
// moins de séries avec plus de repos (apprentissage du mouvement), un avancé enchaîne
// davantage de volume avec moins de récupération.
function buildExercise(
  exerciceId: string,
  niveau: NiveauSportif,
  type: 'force' | 'hypertrophie' | 'endurance' | 'gainage'
): WorkoutExercise {
  const presets: Record<NiveauSportif, Record<typeof type, WorkoutExercise>> = {
    debutant: {
      force: { exerciceId, series: 3, repetitions: '8-10', tempsReposSecondes: 90 },
      hypertrophie: { exerciceId, series: 3, repetitions: '10-12', tempsReposSecondes: 75 },
      endurance: { exerciceId, series: 2, repetitions: '15-20', tempsReposSecondes: 45 },
      gainage: { exerciceId, series: 3, repetitions: '20-30 sec', tempsReposSecondes: 45 },
    },
    intermediaire: {
      force: { exerciceId, series: 4, repetitions: '6-8', tempsReposSecondes: 75 },
      hypertrophie: { exerciceId, series: 4, repetitions: '10-12', tempsReposSecondes: 60 },
      endurance: { exerciceId, series: 3, repetitions: '15-20', tempsReposSecondes: 40 },
      gainage: { exerciceId, series: 4, repetitions: '30-45 sec', tempsReposSecondes: 40 },
    },
    avance: {
      force: { exerciceId, series: 5, repetitions: '4-6', tempsReposSecondes: 60 },
      hypertrophie: { exerciceId, series: 5, repetitions: '8-12', tempsReposSecondes: 45 },
      endurance: { exerciceId, series: 4, repetitions: '20-25', tempsReposSecondes: 30 },
      gainage: { exerciceId, series: 5, repetitions: '45-60 sec', tempsReposSecondes: 30 },
    },
  };
  return presets[niveau][type];
}

function hasMateriel(disponible: Materiel[], requis: Materiel): boolean {
  return requis === 'aucun' || disponible.includes(requis);
}

/** Choisit, pour un exercice donné, la première variante dont le matériel est disponible. */
function pickAvailable(ids: string[], disponible: Materiel[]): string | null {
  for (const id of ids) {
    const ex = findExercise(id);
    if (ex && ex.materiel.some((m) => hasMateriel(disponible, m))) {
      return id;
    }
  }
  return null;
}

function session(
  id: string,
  nom: string,
  exos: WorkoutExercise[],
  conseils: string
): WorkoutSessionTemplate {
  return { id, nom, exercices: exos.filter((e) => e.exerciceId !== ''), conseils };
}

/** Construit le programme adapté au profil : objectif, niveau, matériel et fréquence. */
export function generateProgram(profile: UserProfile): WorkoutProgram {
  const { objectif, niveauSportif, materielDisponible, seancesParSemaine } = profile;
  const niveau = niveauSportif;
  const mat = materielDisponible.length > 0 ? materielDisponible : ['aucun' as Materiel];

  const seances: WorkoutSessionTemplate[] = [];

  if (objectif === 'perte_de_poids') {
    seances.push(
      session(
        'full-body-cardio',
        'Full body + cardio modéré',
        [
          buildExercise(pickAvailable(['squat-goblet', 'squats'], mat) ?? 'squats', niveau, 'endurance'),
          buildExercise(pickAvailable(['pompes'], mat) ?? 'pompes', niveau, 'endurance'),
          buildExercise(pickAvailable(['rowing-haltere', 'mountain-climbers'], mat) ?? 'mountain-climbers', niveau, 'endurance'),
          buildExercise('fentes', niveau, 'endurance'),
          buildExercise('gainage', niveau, 'gainage'),
        ],
        'Garder des temps de repos courts pour maintenir la fréquence cardiaque élevée. Hydratation régulière.'
      ),
      session(
        'hiit-debutant',
        'HIIT',
        [
          buildExercise('burpees', niveau, 'endurance'),
          buildExercise('mountain-climbers', niveau, 'endurance'),
          buildExercise('squats', niveau, 'endurance'),
          buildExercise('crunchs', niveau, 'gainage'),
        ],
        "Alterner 30 secondes d'effort et 30 secondes de repos. Adapter l'intensité à votre niveau."
      ),
      session(
        'renforcement-general',
        'Renforcement général',
        [
          buildExercise(pickAvailable(['developpe-epaules-halteres'], mat) ?? 'pompes', niveau, 'hypertrophie'),
          buildExercise('fentes', niveau, 'hypertrophie'),
          buildExercise('dips-chaise', niveau, 'hypertrophie'),
          buildExercise('gainage', niveau, 'gainage'),
        ],
        'Privilégier une exécution contrôlée plutôt que la vitesse.'
      )
    );
  } else if (objectif === 'prise_de_muscle') {
    seances.push(
      session(
        'push',
        'Push (Pousser)',
        [
          buildExercise(pickAvailable(['developpe-couche-banc', 'pompes'], mat) ?? 'pompes', niveau, 'hypertrophie'),
          buildExercise(pickAvailable(['developpe-epaules-halteres'], mat) ?? 'pompes', niveau, 'hypertrophie'),
          buildExercise(pickAvailable(['extensions-triceps'], mat) ?? 'dips-chaise', niveau, 'hypertrophie'),
        ],
        'Augmenter progressivement la charge dès que les répétitions hautes deviennent faciles.'
      ),
      session(
        'pull',
        'Pull (Tirer)',
        [
          buildExercise(pickAvailable(['tirage-poulie-haute', 'rowing-haltere', 'elastique-tirage'], mat) ?? 'rowing-haltere', niveau, 'hypertrophie'),
          buildExercise(pickAvailable(['curl-biceps'], mat) ?? 'curl-biceps', niveau, 'hypertrophie'),
          buildExercise('gainage', niveau, 'gainage'),
        ],
        'Bien contracter le dos à chaque répétition, éviter de tirer avec les bras uniquement.'
      ),
      session(
        'legs',
        'Legs (Jambes)',
        [
          buildExercise(pickAvailable(['presse-jambes', 'squat-goblet', 'squats'], mat) ?? 'squats', niveau, 'hypertrophie'),
          buildExercise(pickAvailable(['souleve-terre-jambes-tendues'], mat) ?? 'fentes', niveau, 'hypertrophie'),
          buildExercise('fentes', niveau, 'hypertrophie'),
        ],
        "Échauffement articulaire conseillé avant la séance de jambes."
      )
    );
  } else if (objectif === 'recomposition_corporelle') {
    seances.push(
      session(
        'full-body-hypertrophie',
        'Full body hypertrophie',
        [
          buildExercise(pickAvailable(['squat-goblet', 'squats'], mat) ?? 'squats', niveau, 'hypertrophie'),
          buildExercise(pickAvailable(['developpe-epaules-halteres', 'pompes'], mat) ?? 'pompes', niveau, 'hypertrophie'),
          buildExercise(pickAvailable(['rowing-haltere', 'elastique-tirage'], mat) ?? 'gainage', niveau, 'hypertrophie'),
          buildExercise('gainage', niveau, 'gainage'),
        ],
        'Associer ce programme à un apport protéique élevé et régulier dans la journée.'
      ),
      session(
        'haut-du-corps',
        'Haut du corps',
        [
          buildExercise(pickAvailable(['developpe-couche-banc', 'pompes'], mat) ?? 'pompes', niveau, 'hypertrophie'),
          buildExercise(pickAvailable(['curl-biceps'], mat) ?? 'dips-chaise', niveau, 'hypertrophie'),
          buildExercise(pickAvailable(['extensions-triceps'], mat) ?? 'dips-chaise', niveau, 'hypertrophie'),
        ],
        'Maintenir un tempo lent et contrôlé pour maximiser le travail musculaire.'
      ),
      session(
        'bas-du-corps',
        'Bas du corps',
        [
          buildExercise(pickAvailable(['presse-jambes', 'squats'], mat) ?? 'squats', niveau, 'hypertrophie'),
          buildExercise('fentes', niveau, 'hypertrophie'),
          buildExercise(pickAvailable(['souleve-terre-jambes-tendues'], mat) ?? 'fentes', niveau, 'hypertrophie'),
        ],
        'Travailler l’amplitude complète pour un développement musculaire harmonieux.'
      )
    );
  } else {
    // renforcement_musculaire et maintien
    seances.push(
      session(
        'gainage-mobilite',
        'Gainage et mobilité',
        [
          buildExercise('gainage', niveau, 'gainage'),
          buildExercise('crunchs', niveau, 'gainage'),
          buildExercise('mountain-climbers', niveau, 'endurance'),
        ],
        'Travailler la respiration et le contrôle postural pendant les exercices de gainage.'
      ),
      session(
        'haut-du-corps-renfo',
        'Haut du corps',
        [
          buildExercise(pickAvailable(['developpe-epaules-halteres', 'pompes'], mat) ?? 'pompes', niveau, 'force'),
          buildExercise(pickAvailable(['rowing-haltere', 'elastique-tirage'], mat) ?? 'dips-chaise', niveau, 'force'),
          buildExercise('dips-chaise', niveau, 'force'),
        ],
        'Privilégier la qualité d’exécution pour limiter les risques de blessure.'
      ),
      session(
        'jambes-dos',
        'Jambes et dos',
        [
          buildExercise(pickAvailable(['squat-goblet', 'squats'], mat) ?? 'squats', niveau, 'force'),
          buildExercise('fentes', niveau, 'force'),
          buildExercise(pickAvailable(['souleve-terre-jambes-tendues'], mat) ?? 'gainage', niveau, 'force'),
        ],
        'Renforcer la chaîne postérieure aide à prévenir les douleurs lombaires.'
      )
    );
  }

  // Adapter le nombre de séances proposées à la fréquence souhaitée par l'utilisateur,
  // en répétant le cycle de séances si nécessaire.
  const seancesAjustees: WorkoutSessionTemplate[] = [];
  for (let i = 0; i < seancesParSemaine; i++) {
    const base = seances[i % seances.length];
    seancesAjustees.push({ ...base, id: `${base.id}-${i + 1}` });
  }

  const noms: Record<typeof objectif, string> = {
    perte_de_poids: 'Programme perte de poids',
    prise_de_muscle: 'Programme prise de muscle',
    recomposition_corporelle: 'Programme recomposition corporelle',
    renforcement_musculaire: 'Programme renforcement musculaire',
    maintien: 'Programme de maintien',
  };

  const progressions: Record<typeof objectif, string> = {
    perte_de_poids: 'Augmentez progressivement la durée des intervalles cardio et réduisez les temps de repos toutes les 2 semaines.',
    prise_de_muscle: 'Augmentez les charges de 2,5 à 5% dès que vous atteignez le haut de la fourchette de répétitions sur toutes les séries.',
    recomposition_corporelle: 'Alternez les semaines à volume élevé et les semaines de récupération active toutes les 3-4 semaines.',
    renforcement_musculaire: 'Augmentez progressivement le nombre de répétitions avant d’ajouter de la charge.',
    maintien: 'Variez régulièrement les exercices pour conserver la motivation et solliciter différents groupes musculaires.',
  };

  return {
    id: `program-${objectif}-${niveau}`,
    nom: noms[objectif],
    objectif,
    niveau,
    nombreSemaines: 8,
    seancesParSemaine,
    seances: seancesAjustees,
    progressionRecommandee: progressions[objectif],
  };
}
