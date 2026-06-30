import { useMemo, useState } from 'react';
import exercisesData from '../data/exercises.json';
import Modal from '../components/Modal';
import { useAppData } from '../hooks/useAppData';
import { MATERIEL_OPTIONS, NIVEAU_SPORTIF_OPTIONS } from '../utils/profileOptions';
import { getExerciseHistory, getPersonalRecord, getTotalVolume, suggestNextProgression } from '../utils/exerciseProgression';
import { formatDateFr } from '../utils/date';
import type { Exercise, Materiel, NiveauSportif } from '../types';

const exercises = exercisesData as Exercise[];

export default function ExerciseLibrary() {
  const { exerciseLogs } = useAppData();
  const [search, setSearch] = useState('');
  const [materielFilter, setMaterielFilter] = useState<Materiel | 'tous'>('tous');
  const [niveauFilter, setNiveauFilter] = useState<NiveauSportif | 'tous'>('tous');
  const [selected, setSelected] = useState<Exercise | null>(null);

  const history = selected ? getExerciseHistory(selected.id, exerciseLogs) : [];
  const record = getPersonalRecord(history);
  const volume = getTotalVolume(history);
  const recommendation = suggestNextProgression(history);

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (search && !ex.nom.toLowerCase().includes(search.toLowerCase()) && !ex.groupeMusculaire.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (materielFilter !== 'tous' && !ex.materiel.includes(materielFilter)) return false;
      if (niveauFilter !== 'tous' && ex.niveau && !ex.niveau.includes(niveauFilter)) return false;
      return true;
    });
  }, [search, materielFilter, niveauFilter]);

  return (
    <div>
      <div className="page-header">
        <h1>Bibliothèque d'exercices</h1>
        <p className="text-muted">
          Consultez les consignes, erreurs fréquentes et variantes de chaque exercice avant de l'intégrer à votre séance.
        </p>
      </div>

      <div className="card section">
        <div className="grid grid--3">
          <div className="form-group">
            <label className="form-label" htmlFor="exSearch">Rechercher</label>
            <input
              id="exSearch"
              className="form-input"
              type="text"
              placeholder="Nom ou groupe musculaire..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="exMateriel">Matériel</label>
            <select id="exMateriel" className="form-select" value={materielFilter} onChange={(e) => setMaterielFilter(e.target.value as Materiel | 'tous')}>
              <option value="tous">Tous</option>
              {MATERIEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="exNiveau">Niveau</label>
            <select id="exNiveau" className="form-select" value={niveauFilter} onChange={(e) => setNiveauFilter(e.target.value as NiveauSportif | 'tous')}>
              <option value="tous">Tous</option>
              {NIVEAU_SPORTIF_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid--3">
        {filtered.map((ex) => (
          <div className="card card--clickable" key={ex.id} onClick={() => setSelected(ex)}>
            <span className="badge">{ex.groupeMusculaire}</span>
            <h3 style={{ marginTop: 'var(--space-2)' }}>{ex.nom}</h3>
            <p className="text-muted">
              {ex.materiel.map((m) => MATERIEL_OPTIONS.find((o) => o.value === m)?.label ?? m).join(', ')}
            </p>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <div className="empty-state card">Aucun exercice ne correspond à ces critères.</div>}

      {selected && (
        <Modal title={selected.nom} onClose={() => setSelected(null)}>
          <p className="text-muted">
            {selected.groupeMusculaire} · {selected.materiel.map((m) => MATERIEL_OPTIONS.find((o) => o.value === m)?.label ?? m).join(', ')}
          </p>

          <div className="section">
            <h4>Consignes d'exécution</h4>
            <p>{selected.instructions}</p>
          </div>

          {selected.erreursFrequentes && selected.erreursFrequentes.length > 0 && (
            <div className="section">
              <h4>⚠️ Erreurs fréquentes</h4>
              <ul style={{ listStyle: 'disc', paddingLeft: 'var(--space-5)' }}>
                {selected.erreursFrequentes.map((err) => <li key={err}>{err}</li>)}
              </ul>
            </div>
          )}

          {(selected.varianteFacile || selected.varianteDifficile) && (
            <div className="grid grid--2 section">
              {selected.varianteFacile && (
                <div>
                  <h4>🟢 Variante facile</h4>
                  <p>{selected.varianteFacile}</p>
                </div>
              )}
              {selected.varianteDifficile && (
                <div>
                  <h4>🔴 Variante difficile</h4>
                  <p>{selected.varianteDifficile}</p>
                </div>
              )}
            </div>
          )}

          {selected.conseilsSecurite && (
            <div className="disclaimer">🛡️ {selected.conseilsSecurite}</div>
          )}

          <div className="section">
            <h4>📈 Progression personnelle</h4>
            {history.length === 0 ? (
              <p className="text-muted">Pas encore de données pour cet exercice — réalisez-le en mode séance en direct pour commencer le suivi.</p>
            ) : (
              <>
                <div className="grid grid--3">
                  <div className="card">
                    <div className="card__title">Record personnel</div>
                    <div className="card__value">{record?.chargeKg ? `${record.chargeKg} kg × ${record.repetitions}` : `${record?.repetitions} reps`}</div>
                  </div>
                  <div className="card">
                    <div className="card__title">Volume total</div>
                    <div className="card__value">{Math.round(volume)}</div>
                  </div>
                  <div className="card">
                    <div className="card__title">Dernière séance</div>
                    <div className="card__value">{formatDateFr(history[0].date)}</div>
                  </div>
                </div>
                {recommendation && (
                  <div className="goal-banner" style={{ marginTop: 'var(--space-3)' }}>
                    <span className="goal-banner__icon" aria-hidden="true">💡</span>
                    <p style={{ margin: 0 }}>{recommendation}</p>
                  </div>
                )}
                <ul style={{ marginTop: 'var(--space-3)' }}>
                  {history.slice(0, 5).map((log) => (
                    <li className="list-item" key={log.id}>
                      <div className="list-item__main">
                        <span className="list-item__title">{formatDateFr(log.date)}</span>
                        <span className="list-item__subtitle">
                          {log.series.map((s) => `${s.repetitions}${s.chargeKg ? `×${s.chargeKg}kg` : ''}`).join(' · ')}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
