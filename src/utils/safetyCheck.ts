import type { UserProfile, NutritionTargets, SafetyWarning } from '../types';
import { calculateBMR, calculateTDEE } from './calculations';

const ABSOLUTE_FLOOR: Record<UserProfile['sexe'], number> = { homme: 1500, femme: 1200 };

function calculerIMC(profile: UserProfile): number {
  const tailleM = profile.tailleCm / 100;
  return profile.poidsActuel / (tailleM * tailleM);
}

/** Détecte les configurations de profil/objectif potentiellement dangereuses ou
 * incohérentes. Approche par règles simples (pas de diagnostic médical) : en cas de doute,
 * on prévient plutôt qu'on ne bloque, et on renvoie toujours vers un professionnel de santé. */
export function checkProfileSafety(profile: UserProfile, targets: NutritionTargets): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];

  // 1. Calories cibles trop basses (sous le métabolisme de base ou un plancher absolu).
  const bmr = calculateBMR(profile);
  const floor = Math.max(bmr, ABSOLUTE_FLOOR[profile.sexe]);
  if (targets.calories < floor) {
    warnings.push({
      niveau: 'alerte',
      message: `Les calories cibles calculées (${Math.round(targets.calories)} kcal) sont en dessous du seuil de sécurité recommandé (${Math.round(floor)} kcal). Un déficit trop important peut nuire à la santé.`,
    });
  }

  // 2. Rythme de perte/prise de poids visé trop rapide, déduit du déficit/surplus calorique.
  const tdee = calculateTDEE(profile);
  const ecartQuotidien = tdee - targets.calories; // positif = déficit (perte), négatif = surplus (prise)
  const rythmeViseKgParSemaine = (ecartQuotidien * 7) / 7700;
  if (Math.abs(rythmeViseKgParSemaine) / profile.poidsActuel > 0.01) {
    warnings.push({
      niveau: 'alerte',
      message: `Le rythme visé par votre objectif actuel (≈ ${Math.abs(rythmeViseKgParSemaine).toFixed(2)} kg/semaine) dépasse 1% de votre poids corporel par semaine, ce qui est considéré comme rapide.`,
    });
  }

  // 3. Objectif incohérent avec le poids cible renseigné.
  if (profile.objectif === 'perte_de_poids' && profile.poidsCible > profile.poidsActuel) {
    warnings.push({
      niveau: 'attention',
      message: "Votre objectif est « Perte de poids » mais votre poids cible est supérieur à votre poids actuel : vérifiez ces valeurs.",
    });
  }
  if (profile.objectif === 'prise_de_muscle' && profile.poidsCible < profile.poidsActuel) {
    warnings.push({
      niveau: 'attention',
      message: "Votre objectif est « Prise de muscle » mais votre poids cible est inférieur à votre poids actuel : vérifiez ces valeurs.",
    });
  }
  const ecartPoidsPourcent = Math.abs(profile.poidsCible - profile.poidsActuel) / profile.poidsActuel;
  if (ecartPoidsPourcent > 0.3) {
    warnings.push({
      niveau: 'attention',
      message: 'Votre poids cible est très éloigné de votre poids actuel (plus de 30%) : envisagez de fixer des paliers intermédiaires plus réalistes.',
    });
  }

  // 4. IMC extrême (à titre indicatif uniquement, l'IMC ne reflète pas tout le monde).
  const imc = calculerIMC(profile);
  if (imc < 16) {
    warnings.push({
      niveau: 'alerte',
      message: `Votre IMC actuel (${imc.toFixed(1)}) est très bas (< 16). Cette situation nécessite un avis médical avant d'entamer un programme de perte de poids.`,
    });
  } else if (imc > 40) {
    warnings.push({
      niveau: 'alerte',
      message: `Votre IMC actuel (${imc.toFixed(1)}) est très élevé (> 40). Un accompagnement par un professionnel de santé est recommandé.`,
    });
  }

  return warnings;
}
