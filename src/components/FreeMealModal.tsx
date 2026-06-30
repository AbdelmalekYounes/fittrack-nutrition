import { useState } from 'react';
import Modal from './Modal';
import { FREE_MEAL_ESTIMATES, estimateFreeMealMacros, type NiveauEstimation } from '../data/freeMealEstimates';
import type { MealEntry } from '../types';

const NIVEAU_LABELS: Record<NiveauEstimation, string> = { basse: 'Estimation basse', moyenne: 'Estimation moyenne', haute: 'Estimation haute' };

interface FreeMealModalProps {
  onClose: () => void;
  caloriesRestantes: number;
  proteinesRestantes: number;
  onConfirm: (entry: Omit<MealEntry, 'id' | 'date' | 'typeRepas'>) => void;
}

/** Mode "repas libre" : pour les repas difficiles à calculer précisément (restaurant,
 * fast-food, pizza...), propose une estimation basse/moyenne/haute par type de repas, puis
 * un conseil bienveillant (jamais culpabilisant) pour équilibrer le reste de la journée. */
export default function FreeMealModal({ onClose, caloriesRestantes, proteinesRestantes, onConfirm }: FreeMealModalProps) {
  const [typeIndex, setTypeIndex] = useState(0);
  const [niveau, setNiveau] = useState<NiveauEstimation>('moyenne');
  const [added, setAdded] = useState<{ calories: number } | null>(null);

  const estimate = FREE_MEAL_ESTIMATES[typeIndex];
  const macros = estimateFreeMealMacros(estimate, niveau);

  function handleAdd() {
    onConfirm({
      nom: `${estimate.label} (${NIVEAU_LABELS[niveau].toLowerCase()})`,
      quantiteGrammes: 1,
      calories: macros.calories,
      proteines: macros.proteines,
      glucides: macros.glucides,
      lipides: macros.lipides,
      fibres: macros.fibres,
    });
    setAdded({ calories: macros.calories });
  }

  if (added) {
    const depassement = added.calories - caloriesRestantes;
    return (
      <Modal title="Repas ajouté 👍" onClose={onClose}>
        <p>
          Votre repas « {estimate.label} » a bien été ajouté ({added.calories} kcal estimées).
        </p>
        <div className="goal-banner" style={{ marginTop: 'var(--space-3)' }}>
          <span className="goal-banner__icon" aria-hidden="true">💬</span>
          <div>
            {depassement > 0 ? (
              <>
                <p style={{ margin: 0, fontWeight: 600 }}>
                  Ce repas dépasse d'environ {Math.round(depassement)} kcal ce qu'il restait pour aujourd'hui — et c'est tout à fait normal de temps en temps.
                </p>
                <p className="text-muted" style={{ margin: 0 }}>
                  Pas besoin de compenser en sautant un repas : privilégiez simplement des options légères et riches en protéines au prochain repas (légumes, protéines maigres), et reprenez votre rythme habituel dès demain.
                </p>
              </>
            ) : (
              <>
                <p style={{ margin: 0, fontWeight: 600 }}>
                  Ce repas reste dans votre enveloppe calorique du jour, bien joué !
                </p>
                <p className="text-muted" style={{ margin: 0 }}>
                  Pensez aux protéines pour la suite de la journée si {Math.round(proteinesRestantes)} g restent à atteindre.
                </p>
              </>
            )}
          </div>
        </div>
        <button type="button" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }} onClick={onClose}>
          Fermer
        </button>
      </Modal>
    );
  }

  return (
    <Modal title="Repas restaurant / libre" onClose={onClose}>
      <p className="text-muted">
        Pour les repas difficiles à calculer précisément : choisissez le type le plus proche et un niveau d'estimation.
      </p>

      <div className="form-group">
        <label className="form-label" htmlFor="freeMealType">Type de repas</label>
        <select id="freeMealType" className="form-select" value={typeIndex} onChange={(e) => setTypeIndex(Number(e.target.value))}>
          {FREE_MEAL_ESTIMATES.map((est, i) => (
            <option key={est.type} value={i}>{est.emoji} {est.label}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Niveau d'estimation</label>
        <div className="checkbox-group">
          {(['basse', 'moyenne', 'haute'] as NiveauEstimation[]).map((n) => (
            <button
              type="button"
              key={n}
              className={`btn btn-sm ${niveau === n ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setNiveau(n)}
            >
              {NIVEAU_LABELS[n]} ({estimate.caloriesParNiveau[n]} kcal)
            </button>
          ))}
        </div>
      </div>

      <p className="text-muted">
        ≈ {macros.calories} kcal · P {macros.proteines}g · G {macros.glucides}g · L {macros.lipides}g · Fibres {macros.fibres}g
      </p>

      <button type="button" className="btn btn-primary" onClick={handleAdd}>
        ✅ Ajouter ce repas
      </button>
    </Modal>
  );
}
