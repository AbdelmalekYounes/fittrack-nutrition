import { useState } from 'react';
import { useAppData } from '../hooks/useAppData';
import type { UserProfile, Sexe, NiveauSportif, Objectif, Materiel, PreferenceAlimentaire, NiveauActivite } from '../types';
import {
  MATERIEL_OPTIONS,
  PREFERENCE_OPTIONS,
  OBJECTIF_OPTIONS,
  NIVEAU_SPORTIF_OPTIONS,
  NIVEAU_ACTIVITE_OPTIONS,
  emptyProfile,
} from '../utils/profileOptions';

const TOTAL_STEPS = 4;

/** Écran de bienvenue affiché au tout premier lancement (aucun profil en localStorage).
 * Guide la création du profil en 4 étapes courtes plutôt qu'un long formulaire d'un coup,
 * avec un raccourci pour découvrir l'app via des données de démonstration. */
export default function Onboarding() {
  const { setProfile, loadDemoData } = useAppData();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<UserProfile>(emptyProfile());
  const [allergyInput, setAllergyInput] = useState('');
  const [error, setError] = useState('');

  function updateField<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleMateriel(value: Materiel) {
    setForm((prev) => ({
      ...prev,
      materielDisponible: prev.materielDisponible.includes(value)
        ? prev.materielDisponible.filter((m) => m !== value)
        : [...prev.materielDisponible, value],
    }));
  }

  function togglePreference(value: PreferenceAlimentaire) {
    setForm((prev) => ({
      ...prev,
      preferencesAlimentaires: prev.preferencesAlimentaires.includes(value)
        ? prev.preferencesAlimentaires.filter((p) => p !== value)
        : [...prev.preferencesAlimentaires, value],
    }));
  }

  function addAllergy() {
    const value = allergyInput.trim();
    if (!value || form.allergies.includes(value)) return;
    setForm((prev) => ({ ...prev, allergies: [...prev.allergies, value] }));
    setAllergyInput('');
  }

  function removeAllergy(value: string) {
    setForm((prev) => ({ ...prev, allergies: prev.allergies.filter((a) => a !== value) }));
  }

  function validateStep(current: number): boolean {
    if (current === 0) {
      if (!form.prenom.trim()) return setError('Indiquez votre prénom pour continuer.'), false;
      if (form.age < 10 || form.age > 100) return setError('Âge invalide (10-100 ans).'), false;
      if (form.tailleCm < 100 || form.tailleCm > 250) return setError('Taille invalide (100-250 cm).'), false;
      if (form.poidsActuel < 30 || form.poidsActuel > 300) return setError('Poids invalide (30-300 kg).'), false;
      if (form.poidsCible < 30 || form.poidsCible > 300) return setError('Poids cible invalide (30-300 kg).'), false;
    }
    setError('');
    return true;
  }

  function goNext() {
    if (!validateStep(step)) return;
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  }

  function goBack() {
    setError('');
    if (step > 0) setStep((s) => s - 1);
  }

  function finish() {
    if (!validateStep(0)) {
      setStep(0);
      return;
    }
    setProfile(form);
  }

  return (
    <div className="onboarding">
      <div className="onboarding__card card">
        <div className="onboarding__header">
          <div>
            <h1>Bienvenue sur FitTrack Nutrition 👋</h1>
            <p className="text-muted">
              Quelques informations pour calculer vos besoins et générer un programme adapté.
              Étape {step + 1} / {TOTAL_STEPS}.
            </p>
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => loadDemoData()}>
            Découvrir avec des données de démo
          </button>
        </div>

        <div className="onboarding__progress">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className={`onboarding__dot ${i <= step ? 'active' : ''}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="onboarding__step">
            <h3>Vos informations</h3>
            <div className="grid grid--2">
              <div className="form-group">
                <label className="form-label" htmlFor="ob-prenom">Prénom</label>
                <input id="ob-prenom" className="form-input" type="text" autoFocus value={form.prenom} onChange={(e) => updateField('prenom', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ob-sexe">Sexe</label>
                <select id="ob-sexe" className="form-select" value={form.sexe} onChange={(e) => updateField('sexe', e.target.value as Sexe)}>
                  <option value="homme">Homme</option>
                  <option value="femme">Femme</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ob-age">Âge</label>
                <input id="ob-age" className="form-input" type="number" value={form.age} onChange={(e) => updateField('age', Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ob-taille">Taille (cm)</label>
                <input id="ob-taille" className="form-input" type="number" value={form.tailleCm} onChange={(e) => updateField('tailleCm', Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ob-poids">Poids actuel (kg)</label>
                <input id="ob-poids" className="form-input" type="number" step="0.1" value={form.poidsActuel} onChange={(e) => updateField('poidsActuel', Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ob-poidsCible">Poids cible (kg)</label>
                <input id="ob-poidsCible" className="form-input" type="number" step="0.1" value={form.poidsCible} onChange={(e) => updateField('poidsCible', Number(e.target.value))} />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="onboarding__step">
            <h3>Votre objectif</h3>
            <div className="onboarding__objectifs">
              {OBJECTIF_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  className={`onboarding__objectif-card ${form.objectif === opt.value ? 'selected' : ''}`}
                  onClick={() => updateField('objectif', opt.value as Objectif)}
                >
                  <strong>{opt.label}</strong>
                  <span className="text-muted">{opt.description}</span>
                </button>
              ))}
            </div>
            <div className="grid grid--2" style={{ marginTop: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="ob-niveau">Niveau sportif</label>
                <select id="ob-niveau" className="form-select" value={form.niveauSportif} onChange={(e) => updateField('niveauSportif', e.target.value as NiveauSportif)}>
                  {NIVEAU_SPORTIF_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ob-activite">Niveau d'activité quotidienne</label>
                <select id="ob-activite" className="form-select" value={form.niveauActivite} onChange={(e) => updateField('niveauActivite', e.target.value as NiveauActivite)}>
                  {NIVEAU_ACTIVITE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ob-seances">Séances de sport par semaine</label>
                <input id="ob-seances" className="form-input" type="number" value={form.seancesParSemaine} onChange={(e) => updateField('seancesParSemaine', Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ob-duree">Durée par séance (minutes)</label>
                <input id="ob-duree" className="form-input" type="number" value={form.dureeSeanceMinutes} onChange={(e) => updateField('dureeSeanceMinutes', Number(e.target.value))} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding__step">
            <h3>Matériel et alimentation</h3>
            <div className="form-group">
              <label className="form-label">Matériel disponible</label>
              <div className="checkbox-group">
                {MATERIEL_OPTIONS.map((opt) => (
                  <label key={opt.value} className={`checkbox-pill ${form.materielDisponible.includes(opt.value) ? 'checked' : ''}`}>
                    <input type="checkbox" checked={form.materielDisponible.includes(opt.value)} onChange={() => toggleMateriel(opt.value)} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Préférences alimentaires</label>
              <div className="checkbox-group">
                {PREFERENCE_OPTIONS.map((opt) => (
                  <label key={opt.value} className={`checkbox-pill ${form.preferencesAlimentaires.includes(opt.value) ? 'checked' : ''}`}>
                    <input type="checkbox" checked={form.preferencesAlimentaires.includes(opt.value)} onChange={() => togglePreference(opt.value)} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ob-allergies">Allergies / aliments à éviter</label>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <input
                  id="ob-allergies"
                  className="form-input"
                  type="text"
                  placeholder="Ex: arachide, fruits de mer..."
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAllergy(); } }}
                />
                <button type="button" className="btn btn-outline" onClick={addAllergy}>Ajouter</button>
              </div>
              {form.allergies.length > 0 && (
                <div className="tag-list" style={{ marginTop: 'var(--space-2)' }}>
                  {form.allergies.map((allergy) => (
                    <span key={allergy} className="tag">
                      {allergy}
                      <button type="button" className="tag__remove" onClick={() => removeAllergy(allergy)} aria-label={`Retirer ${allergy}`}>✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding__step">
            <h3>Récapitulatif</h3>
            <p className="text-muted">Vérifiez vos informations avant de démarrer. Vous pourrez tout modifier plus tard dans « Profil ».</p>
            <ul className="onboarding__summary">
              <li><strong>{form.prenom}</strong>, {form.sexe === 'homme' ? 'Homme' : 'Femme'}, {form.age} ans</li>
              <li>{form.tailleCm} cm · {form.poidsActuel} kg → objectif {form.poidsCible} kg</li>
              <li>Objectif : {OBJECTIF_OPTIONS.find((o) => o.value === form.objectif)?.label}</li>
              <li>Niveau {NIVEAU_SPORTIF_OPTIONS.find((o) => o.value === form.niveauSportif)?.label} · {form.seancesParSemaine} séances/semaine de {form.dureeSeanceMinutes} min</li>
              <li>Matériel : {form.materielDisponible.length > 0 ? form.materielDisponible.join(', ') : 'aucun'}</li>
              <li>Préférences : {form.preferencesAlimentaires.join(', ')}{form.allergies.length > 0 ? ` · À éviter : ${form.allergies.join(', ')}` : ''}</li>
            </ul>
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="onboarding__nav">
          {step > 0 ? (
            <button type="button" className="btn btn-outline" onClick={goBack}>← Précédent</button>
          ) : <span />}
          {step < TOTAL_STEPS - 1 ? (
            <button type="button" className="btn btn-primary" onClick={goNext}>Suivant →</button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={finish}>Commencer 🚀</button>
          )}
        </div>
      </div>
    </div>
  );
}
