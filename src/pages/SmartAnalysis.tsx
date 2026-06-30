import { useMemo } from 'react';
import { useAppData } from '../hooks/useAppData';
import { useNutritionTargets } from '../hooks/useNutritionTargets';
import { buildStagnationReport } from '../utils/stagnationCoach';
import type { StagnationIssue } from '../types';

const GRAVITE_ICON: Record<StagnationIssue['gravite'], string> = {
  info: 'ℹ️',
  attention: '🟡',
  alerte: '🔴',
};

function IssueList({ issues }: { issues: StagnationIssue[] }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {issues.map((issue, i) => (
        <li key={i} className={`safety-warning ${issue.gravite !== 'info' ? `safety-warning--${issue.gravite}` : ''}`}>
          <p style={{ margin: 0, fontWeight: 600 }}>{GRAVITE_ICON[issue.gravite]} {issue.message}</p>
          <p style={{ margin: 0, marginTop: 'var(--space-1)' }}>{issue.recommandation}</p>
        </li>
      ))}
    </ul>
  );
}

/** Page "Analyse intelligente" : coach anti-stagnation analysant les 14 et 30 derniers
 * jours pour détecter stagnation, déficit mal calibré, manque de régularité, etc., et
 * proposer des recommandations concrètes toujours bornées à des valeurs sûres. */
export default function SmartAnalysis() {
  const { profile, meals, activities, weights } = useAppData();
  const targets = useNutritionTargets(profile);

  const report = useMemo(() => {
    if (!profile || !targets) return null;
    return buildStagnationReport(profile, targets, meals, activities, weights);
  }, [profile, targets, meals, activities, weights]);

  if (!profile) {
    return <p className="text-muted">Complétez d'abord votre profil pour accéder à l'analyse intelligente.</p>;
  }
  if (!report) return null;

  return (
    <div>
      <div className="page-header">
        <h1>Analyse intelligente</h1>
        <p className="text-muted">
          Le coach anti-stagnation analyse vos 14 et 30 derniers jours pour repérer ce qui freine votre progression.
        </p>
      </div>

      <div className="disclaimer">
        Ces analyses sont des estimations automatiques basées sur vos données et ne remplacent pas l'avis d'un professionnel de santé.
      </div>

      <div className="card section">
        <h3>📅 14 derniers jours</h3>
        <IssueList issues={report.analyses14j} />
      </div>

      <div className="card section">
        <h3>📆 30 derniers jours</h3>
        <IssueList issues={report.analyses30j} />
      </div>
    </div>
  );
}
