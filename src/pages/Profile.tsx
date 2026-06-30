import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import type {
  UserProfile,
  Sexe,
  NiveauSportif,
  Objectif,
  Materiel,
  PreferenceAlimentaire,
  NiveauActivite,
} from '../types';
import { buildDemoProfile } from '../utils/storage';

const MATERIEL_OPTIONS: { value: Materiel; label: string }[] = [
  { value: 'aucun', label: 'Aucun (poids du corps)' },
  { value: 'halteres', label: 'Haltères' },
  { value: 'elastiques', label: 'Élastiques' },
  { value: 'salle_de_sport', label: 'Salle de sport' },
  { value: 'velo', label: 'Vélo' },
  { value: 'tapis_de_course', label: 'Tapis de course' },
];

const PREFERENCE_OPTIONS: { value: PreferenceAlimentaire; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'halal', label: 'Halal' },
  { value: 'vegetarien', label: 'Végétarien' },
  { value: 'sans_lactose', label: 'Sans lactose' },
  { value: 'sans_gluten', label: 'Sans gluten' },
];

const OBJECTIF_OPTIONS: { value: Objectif; label: string }[] = [
  { value: 'perte_de_poids', label: 'Perte de poids' },
  { value: 'renforcement_musculaire', label: 'Renforcement musculaire' },
  { value: 'prise_de_muscle', label: 'Prise de muscle' },
  { value: 'maintien', label: 'Maintien' },
  { value: 'recomposition_corporelle', label: 'Recomposition corporelle' },
];

const NIVEAU_SPORTIF_OPTIONS: { value: NiveauSportif; label: string }[] = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
];

const NIVEAU_ACTIVITE_OPTIONS: { value: NiveauActivite; label: string }[] = [
  { value: 'sedentaire', label: 'Sédentaire (peu ou pas d\'exercice)' },
  { value: 'leger', label: 'Légèrement actif (1-3 jours/semaine)' },
  { value: 'modere', label: 'Modérément actif (3-5 jours/semaine)' },
  { value: 'actif', label: 'Actif (6-7 jours/semaine)' },
  { value: 'tres_actif', label: 'Très actif (travail physique + sport)' },
];

function emptyProfile(): UserProfile {
  return {
    prenom: '',
    sexe: 'homme',
    age: 25,
    tailleCm: 170,
    poidsActuel: 70,
    poidsCible: 70,
    niveauSportif: 'debutant',
    objectif: 'maintien',
    seancesParSemaine: 3,
    dureeSeanceMinutes: 45,
    materielDisponible: [],
    preferencesAlimentaires: ['normal'],
    allergies: [],
    niveauActivite: 'modere',
  };
}

export default function Profile() {
  const { profile, setProfile, resetAllData } = useAppData();
  const navigate = useNavigate();
  const [form, setForm] = useState<UserProfile>(profile ?? emptyProfile());
  const [allergyInput, setAllergyInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  function updateField<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
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
    if (!value) return;
    if (!form.allergies.includes(value)) {
      setForm((prev) => ({ ...prev, allergies: [...prev.allergies, value] }));
    }
    setAllergyInput('');
  }

  function removeAllergy(value: string) {
    setForm((prev) => ({ ...prev, allergies: prev.allergies.filter((a) => a !== value) }));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!form.prenom.trim()) newErrors.prenom = 'Le prénom est requis.';
    if (form.age < 10 || form.age > 100) newErrors.age = 'Âge invalide (10-100 ans).';
    if (form.tailleCm < 100 || form.tailleCm > 250) newErrors.tailleCm = 'Taille invalide (100-250 cm).';
    if (form.poidsActuel < 30 || form.poidsActuel > 300) newErrors.poidsActuel = 'Poids invalide (30-300 kg).';
    if (form.poidsCible < 30 || form.poidsCible > 300) newErrors.poidsCible = 'Poids cible invalide (30-300 kg).';
    if (form.seancesParSemaine < 0 || form.seancesParSemaine > 14) newErrors.seancesParSemaine = 'Entre 0 et 14 séances.';
    if (form.dureeSeanceMinutes < 0 || form.dureeSeanceMinutes > 300) newErrors.dureeSeanceMinutes = 'Durée invalide.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setProfile(form);
    setSaved(true);
  }

  function handleReset() {
    const confirmed = window.confirm(
      'Voulez-vous vraiment réinitialiser toutes vos données ? Cette action est irréversible.'
    );
    if (!confirmed) return;
    resetAllData();
    setForm(buildDemoProfile());
    navigate('/');
  }

  return (
    <div>
      <div className="page-header">
        <h1>Mon profil</h1>
        <p className="text-muted">
          Ces informations servent à calculer vos besoins nutritionnels et à générer votre
          programme d'entraînement.
        </p>
      </div>

      <div className="disclaimer">
        Les calculs proposés sont des estimations générales et ne remplacent pas l'avis d'un
        professionnel de santé, d'un médecin ou d'un coach diplômé.
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <div className="grid grid--2">
          <div className="form-group">
            <label className="form-label" htmlFor="prenom">Prénom</label>
            <input
              id="prenom"
              className="form-input"
              type="text"
              value={form.prenom}
              onChange={(e) => updateField('prenom', e.target.value)}
            />
            {errors.prenom && <span className="form-error">{errors.prenom}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="sexe">Sexe</label>
            <select
              id="sexe"
              className="form-select"
              value={form.sexe}
              onChange={(e) => updateField('sexe', e.target.value as Sexe)}
            >
              <option value="homme">Homme</option>
              <option value="femme">Femme</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="age">Âge</label>
            <input
              id="age"
              className="form-input"
              type="number"
              value={form.age}
              onChange={(e) => updateField('age', Number(e.target.value))}
            />
            {errors.age && <span className="form-error">{errors.age}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="taille">Taille (cm)</label>
            <input
              id="taille"
              className="form-input"
              type="number"
              value={form.tailleCm}
              onChange={(e) => updateField('tailleCm', Number(e.target.value))}
            />
            {errors.tailleCm && <span className="form-error">{errors.tailleCm}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="poidsActuel">Poids actuel (kg)</label>
            <input
              id="poidsActuel"
              className="form-input"
              type="number"
              step="0.1"
              value={form.poidsActuel}
              onChange={(e) => updateField('poidsActuel', Number(e.target.value))}
            />
            {errors.poidsActuel && <span className="form-error">{errors.poidsActuel}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="poidsCible">Poids cible (kg)</label>
            <input
              id="poidsCible"
              className="form-input"
              type="number"
              step="0.1"
              value={form.poidsCible}
              onChange={(e) => updateField('poidsCible', Number(e.target.value))}
            />
            {errors.poidsCible && <span className="form-error">{errors.poidsCible}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="niveauSportif">Niveau sportif</label>
            <select
              id="niveauSportif"
              className="form-select"
              value={form.niveauSportif}
              onChange={(e) => updateField('niveauSportif', e.target.value as NiveauSportif)}
            >
              {NIVEAU_SPORTIF_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="objectif">Objectif principal</label>
            <select
              id="objectif"
              className="form-select"
              value={form.objectif}
              onChange={(e) => updateField('objectif', e.target.value as Objectif)}
            >
              {OBJECTIF_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="seances">Séances par semaine</label>
            <input
              id="seances"
              className="form-input"
              type="number"
              value={form.seancesParSemaine}
              onChange={(e) => updateField('seancesParSemaine', Number(e.target.value))}
            />
            {errors.seancesParSemaine && <span className="form-error">{errors.seancesParSemaine}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="duree">Durée par séance (minutes)</label>
            <input
              id="duree"
              className="form-input"
              type="number"
              value={form.dureeSeanceMinutes}
              onChange={(e) => updateField('dureeSeanceMinutes', Number(e.target.value))}
            />
            {errors.dureeSeanceMinutes && <span className="form-error">{errors.dureeSeanceMinutes}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="niveauActivite">Niveau d'activité quotidienne</label>
            <select
              id="niveauActivite"
              className="form-select"
              value={form.niveauActivite}
              onChange={(e) => updateField('niveauActivite', e.target.value as NiveauActivite)}
            >
              {NIVEAU_ACTIVITE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Matériel disponible</label>
          <div className="checkbox-group">
            {MATERIEL_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`checkbox-pill ${form.materielDisponible.includes(opt.value) ? 'checked' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={form.materielDisponible.includes(opt.value)}
                  onChange={() => toggleMateriel(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Préférences alimentaires</label>
          <div className="checkbox-group">
            {PREFERENCE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`checkbox-pill ${form.preferencesAlimentaires.includes(opt.value) ? 'checked' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={form.preferencesAlimentaires.includes(opt.value)}
                  onChange={() => togglePreference(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="allergies">Allergies / aliments à éviter</label>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input
              id="allergies"
              className="form-input"
              type="text"
              placeholder="Ex: arachide, fruits de mer..."
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addAllergy();
                }
              }}
            />
            <button type="button" className="btn btn-outline" onClick={addAllergy}>
              Ajouter
            </button>
          </div>
          {form.allergies.length > 0 && (
            <div className="tag-list" style={{ marginTop: 'var(--space-2)' }}>
              {form.allergies.map((allergy) => (
                <span key={allergy} className="tag">
                  {allergy}
                  <button
                    type="button"
                    className="tag__remove"
                    onClick={() => removeAllergy(allergy)}
                    aria-label={`Retirer ${allergy}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="submit" className="btn btn-primary">
            Enregistrer mon profil
          </button>
          {saved && <span style={{ color: 'var(--color-secondary)' }}>Profil enregistré ✓</span>}
        </div>
      </form>

      <div className="card section" style={{ marginTop: 'var(--space-5)' }}>
        <h3>Zone de danger</h3>
        <p className="text-muted">
          Réinitialiser supprime définitivement votre profil, vos repas, activités, pesées et
          votre programme. Des données de démonstration seront proposées au prochain démarrage.
        </p>
        <button type="button" className="btn btn-danger" onClick={handleReset}>
          Réinitialiser mes données
        </button>
      </div>
    </div>
  );
}
