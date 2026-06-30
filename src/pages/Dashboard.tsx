import { Link } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import { useNutritionTargets } from '../hooks/useNutritionTargets';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import Gauge from '../components/Gauge';
import { todayISO, startOfWeek, addDays, formatDateFr } from '../utils/date';
import { generateProgram } from '../utils/program';
import { recommendRecipeOfDay } from '../utils/recipes';
import { ACTIVITY_LABELS } from '../utils/activityLabels';
import recipesData from '../data/recipes.json';
import type { Recipe } from '../types';

const recipes = recipesData as Recipe[];

const OBJECTIF_LABELS: Record<string, string> = {
  perte_de_poids: 'Perte de poids',
  renforcement_musculaire: 'Renforcement musculaire',
  prise_de_muscle: 'Prise de muscle',
  maintien: 'Maintien',
  recomposition_corporelle: 'Recomposition corporelle',
};

export default function Dashboard() {
  const { profile, meals, activities, weights, completedSessions, scheduledSessions } = useAppData();
  const targets = useNutritionTargets(profile);

  if (!profile) {
    return (
      <div className="empty-state card">
        <h2>Bienvenue sur FitTrack Nutrition</h2>
        <p>Pour démarrer, complétez votre profil afin de calculer vos besoins personnalisés.</p>
        <Link to="/profil" className="btn btn-primary">Compléter mon profil</Link>
      </div>
    );
  }

  const today = todayISO();
  const todaysMeals = meals.filter((m) => m.date === today);
  const consumed = todaysMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      proteines: acc.proteines + m.proteines,
      glucides: acc.glucides + m.glucides,
      lipides: acc.lipides + m.lipides,
    }),
    { calories: 0, proteines: 0, glucides: 0, lipides: 0 }
  );

  const caloriesRestantes = targets ? Math.max(0, targets.calories - consumed.calories) : 0;

  const weekStart = startOfWeek(today);
  const sessionsThisWeek = activities.filter((a) => a.date >= weekStart && a.date <= today).length;

  const sortedWeights = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const currentWeight = sortedWeights.length > 0 ? sortedWeights[sortedWeights.length - 1].poids : profile.poidsActuel;

  const startWeight = sortedWeights.length > 0 ? sortedWeights[0].poids : profile.poidsActuel;
  const totalToLose = startWeight - profile.poidsCible;
  const progressToTarget =
    totalToLose !== 0 ? ((startWeight - currentWeight) / totalToLose) * 100 : 100;

  const program = generateProgram(profile);
  const completedIds = new Set(completedSessions.map((c) => c.seanceId));
  const nextSession = program.seances.find((s) => !completedIds.has(s.id)) ?? program.seances[0];

  const upcomingLimit = addDays(today, 6);
  const nextScheduledSession = [...scheduledSessions]
    .filter((s) => s.date >= today && s.date <= upcomingLimit)
    .sort((a, b) => (a.date === b.date ? a.heureDebut.localeCompare(b.heureDebut) : a.date.localeCompare(b.date)))[0];

  const recommendedRecipe = recommendRecipeOfDay(recipes, {
    objectif: profile.objectif,
    caloriesRestantes,
    proteinesRestantes: targets ? Math.max(0, targets.proteines - consumed.proteines) : undefined,
    preferencesAlimentaires: profile.preferencesAlimentaires,
    allergies: profile.allergies,
  });

  return (
    <div>
      <div className="page-header">
        <h1>Bonjour {profile.prenom} 👋</h1>
        <p className="text-muted">Voici votre résumé du jour.</p>
      </div>

      <div className="disclaimer">
        Les valeurs affichées sont des estimations indicatives et ne constituent pas un avis
        médical.
      </div>

      <div className="grid grid--3 section">
        <Card title="Objectif actuel" value={OBJECTIF_LABELS[profile.objectif]} />
        <Card title="Calories consommées" value={`${Math.round(consumed.calories)} kcal`} />
        <Card title="Calories restantes" value={`${Math.round(caloriesRestantes)} kcal`} />
      </div>

      <div className="grid grid--2 section">
        <Card>
          <h3>Macronutriments du jour</h3>
          {targets && (
            <>
              <ProgressBar
                label="Protéines"
                current={consumed.proteines}
                target={targets.proteines}
                unit="g"
                color="var(--color-proteines)"
              />
              <ProgressBar
                label="Glucides"
                current={consumed.glucides}
                target={targets.glucides}
                unit="g"
                color="var(--color-glucides)"
              />
              <ProgressBar
                label="Lipides"
                current={consumed.lipides}
                target={targets.lipides}
                unit="g"
                color="var(--color-lipides)"
              />
            </>
          )}
        </Card>

        <Card>
          <h3>Poids</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
            <Gauge percent={progressToTarget} label="vers l'objectif" />
            <div>
              <p><strong>{currentWeight} kg</strong> actuellement</p>
              <p className="text-muted">Objectif : {profile.poidsCible} kg</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid--3 section">
        <Card title="Séances cette semaine" value={`${sessionsThisWeek} / ${profile.seancesParSemaine}`} />
        <Card title={nextScheduledSession ? 'Prochaine séance planifiée' : 'Prochaine séance recommandée'}>
          {nextScheduledSession ? (
            <>
              <p style={{ fontWeight: 600 }}>
                {nextScheduledSession.titre || ACTIVITY_LABELS[nextScheduledSession.typeActivite]}
              </p>
              <p className="text-muted">
                {formatDateFr(nextScheduledSession.date)} · {nextScheduledSession.heureDebut} - {nextScheduledSession.heureFin}
              </p>
              <Link to="/calendrier" className="btn btn-outline btn-sm">Voir le calendrier</Link>
            </>
          ) : nextSession ? (
            <>
              <p style={{ fontWeight: 600 }}>{nextSession.nom}</p>
              <Link to="/programme" className="btn btn-outline btn-sm">Voir le programme</Link>
            </>
          ) : (
            <p className="text-muted">Aucun programme généré.</p>
          )}
        </Card>
        <Card title="Recette recommandée du jour">
          {recommendedRecipe ? (
            <>
              <p style={{ fontWeight: 600 }}>{recommendedRecipe.nom}</p>
              <p className="text-muted">{recommendedRecipe.calories} kcal · {recommendedRecipe.proteines}g protéines</p>
              <Link to="/recettes" className="btn btn-outline btn-sm">Voir la recette</Link>
            </>
          ) : (
            <p className="text-muted">Aucune recette ne correspond pour le moment.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
