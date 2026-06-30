import { useRef, useState, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import { buildBackupFile, serializeBackup, backupFileName, parseBackupFile } from '../services/backupService';

/** Page Paramètres : export/import JSON (sauvegarde/restauration) et réinitialisation.
 * Aucun composant ne touche localStorage directement : tout passe par useAppData
 * (qui s'appuie sur services/storageService.ts) et services/backupService.ts pour la
 * construction/validation du fichier de sauvegarde. */
export default function Settings() {
  const {
    profile,
    meals,
    activities,
    weights,
    completedSessions,
    scheduledSessions,
    programId,
    favorites,
    mealPlan,
    setProfile,
    setMeals,
    setActivities,
    setWeights,
    setCompletedSessions,
    setScheduledSessions,
    setProgramId,
    setFavorites,
    setMealPlan,
    resetAllData,
  } = useAppData();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function handleExport() {
    const file = buildBackupFile({
      profile,
      meals,
      activities,
      weights,
      completedSessions,
      scheduledSessions,
      programId,
      favorites,
      mealPlan,
    });
    const blob = new Blob([serializeBackup(file)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = backupFileName();
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permet de réimporter le même fichier plus tard si besoin
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = parseBackupFile(String(reader.result ?? ''));
      if (result.ok === false) {
        setImportMessage({ type: 'error', text: result.error });
        return;
      }
      const confirmed = window.confirm(
        'Importer ce fichier remplacera toutes vos données actuelles sur cet appareil. Continuer ?'
      );
      if (!confirmed) return;

      const { data } = result.file;
      setProfile(data.profile);
      setMeals(data.meals);
      setActivities(data.activities);
      setWeights(data.weights);
      setCompletedSessions(data.completedSessions);
      setScheduledSessions(data.scheduledSessions);
      setProgramId(data.programId ?? null);
      setFavorites(data.favorites);
      setMealPlan(data.mealPlan ?? null);
      setImportMessage({ type: 'success', text: 'Données importées avec succès.' });
    };
    reader.onerror = () => setImportMessage({ type: 'error', text: 'Impossible de lire ce fichier.' });
    reader.readAsText(file);
  }

  function handleReset() {
    const confirmed = window.confirm(
      'Voulez-vous vraiment réinitialiser toutes vos données ? Cette action est irréversible.'
    );
    if (!confirmed) return;
    resetAllData();
    navigate('/');
  }

  return (
    <div>
      <div className="page-header">
        <h1>Paramètres</h1>
        <p className="text-muted">
          Sauvegardez, restaurez ou réinitialisez vos données. Tout reste stocké localement sur cet appareil.
        </p>
      </div>

      <div className="card section">
        <h3>Sauvegarde de vos données</h3>
        <p className="text-muted">
          Exportez un fichier JSON complet (profil, repas, activités, pesées, programme, favoris, plan de
          repas) pour le conserver ou le transférer vers un autre appareil.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={handleExport}>
            ⬇️ Exporter mes données
          </button>
          <button type="button" className="btn btn-outline" onClick={handleImportClick}>
            ⬆️ Importer une sauvegarde
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
        {importMessage && (
          <p
            style={{
              color: importMessage.type === 'error' ? 'var(--color-danger)' : 'var(--color-secondary)',
              marginTop: 'var(--space-3)',
              fontWeight: 600,
            }}
          >
            {importMessage.text}
          </p>
        )}
      </div>

      <div className="card section">
        <h3>Confidentialité</h3>
        <p className="text-muted">
          Vos données sont stockées uniquement sur cet appareil, jamais sur un serveur.
        </p>
        <Link to="/confidentialite" className="btn btn-outline btn-sm">
          Voir la page Confidentialité
        </Link>
      </div>

      <div className="card section">
        <h3>Zone de danger</h3>
        <p className="text-muted">
          Réinitialiser supprime définitivement votre profil, vos repas, activités, pesées, programme et
          plan de repas. Pensez à exporter une sauvegarde avant si besoin.
        </p>
        <button type="button" className="btn btn-danger" onClick={handleReset}>
          Réinitialiser mes données
        </button>
      </div>
    </div>
  );
}
