import type { SafetyWarning } from '../types';

interface SafetyWarningsProps {
  warnings: SafetyWarning[];
}

/** Affiche les avertissements de sécurité (objectif/profil) calculés par
 * utils/safetyCheck.ts, avec rappel systématique de consulter un professionnel. */
export default function SafetyWarnings({ warnings }: SafetyWarningsProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="card section safety-warnings">
      <h3>⚠️ Points de vigilance sur votre objectif</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {warnings.map((w, i) => (
          <li key={i} className={`safety-warning safety-warning--${w.niveau}`}>
            {w.niveau === 'alerte' ? '🔴' : '🟡'} {w.message}
          </li>
        ))}
      </ul>
      <p className="text-muted" style={{ marginTop: 'var(--space-3)' }}>
        Ces estimations automatiques ne remplacent pas l'avis d'un médecin, d'un diététicien ou d'un coach diplômé.
        N'hésitez pas à consulter un professionnel de santé avant de modifier significativement vos habitudes.
      </p>
    </div>
  );
}
