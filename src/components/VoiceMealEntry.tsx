import { useState } from 'react';
import Modal from './Modal';
import { useAppData } from '../hooks/useAppData';
import { isSpeechRecognitionSupported, startSpeechRecognition } from '../services/speechService';
import { parseVoiceMealText, type ParsedVoiceItem } from '../utils/voiceMealParser';
import foodsData from '../data/foods.json';
import type { FoodItem } from '../types';

const localFoods = foodsData as FoodItem[];

interface VoiceMealEntryProps {
  onClose: () => void;
  onConfirm: (items: { food: FoodItem; quantiteGrammes: number }[]) => void;
}

/** Ajout de repas par la voix : reconnaissance vocale du navigateur (si disponible) ou
 * saisie texte équivalente, analyse en une liste d'aliments + quantités estimées, puis
 * écran de confirmation/correction avant ajout réel au journal alimentaire. */
export default function VoiceMealEntry({ onClose, onConfirm }: VoiceMealEntryProps) {
  const { customFoods } = useAppData();
  const allFoods = [...localFoods, ...customFoods];

  const [listening, setListening] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ParsedVoiceItem[] | null>(null);

  const speechSupported = isSpeechRecognitionSupported();

  function handleListen() {
    setError(null);
    const session = startSpeechRecognition(
      (transcript) => {
        setListening(false);
        setText(transcript);
        setItems(parseVoiceMealText(transcript, allFoods));
      },
      (message) => {
        setListening(false);
        setError(message);
      }
    );
    if (session) setListening(true);
  }

  function handleAnalyzeText() {
    if (!text.trim()) return;
    setItems(parseVoiceMealText(text, allFoods));
  }

  function updateItem(index: number, patch: Partial<ParsedVoiceItem>) {
    setItems((prev) => (prev ? prev.map((it, i) => (i === index ? { ...it, ...patch } : it)) : prev));
  }

  function removeItem(index: number) {
    setItems((prev) => (prev ? prev.filter((_, i) => i !== index) : prev));
  }

  function handleFoodSelect(index: number, foodId: string) {
    const food = allFoods.find((f) => f.id === foodId) ?? null;
    updateItem(index, { food });
  }

  function handleConfirm() {
    if (!items) return;
    const valid = items.filter((it): it is ParsedVoiceItem & { food: FoodItem } => it.food !== null);
    onConfirm(valid);
  }

  return (
    <Modal title="Ajouter un repas par la voix" onClose={onClose}>
      {!items && (
        <>
          <p className="text-muted">
            Exemple : « j'ai mangé 2 œufs, 100 grammes de riz et 150 grammes de poulet ».
          </p>

          {speechSupported ? (
            <button type="button" className={`btn ${listening ? 'btn-danger' : 'btn-primary'}`} onClick={handleListen} disabled={listening}>
              {listening ? '🎙️ Écoute en cours...' : '🎤 Parler'}
            </button>
          ) : (
            <p className="text-muted">
              La reconnaissance vocale n'est pas disponible sur ce navigateur. Utilisez la saisie texte ci-dessous.
            </p>
          )}
          {error && <p className="form-error">{error}</p>}

          <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
            <label className="form-label" htmlFor="voiceText">Ou décrivez votre repas par écrit</label>
            <textarea
              id="voiceText"
              className="form-textarea"
              rows={3}
              placeholder="Ex: 2 œufs, 100g de riz et 150g de poulet"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn-outline" onClick={handleAnalyzeText} disabled={!text.trim()}>
            Analyser le texte
          </button>
        </>
      )}

      {items && (
        <div>
          <p className="text-muted">Vérifiez et corrigez si besoin avant d'ajouter ces aliments au repas.</p>
          {items.length === 0 && <p className="text-muted">Aucun aliment détecté dans le texte.</p>}
          <ul>
            {items.map((item, i) => (
              <li className="list-item" key={i} style={{ flexWrap: 'wrap' }}>
                <div className="list-item__main" style={{ flex: 1, minWidth: 200 }}>
                  <span className="list-item__title">« {item.rawText} »</span>
                  {!item.food && <span className="form-error">Aliment non reconnu — sélectionnez-le manuellement.</span>}
                  <select
                    className="form-select"
                    style={{ marginTop: 'var(--space-1)' }}
                    value={item.food?.id ?? ''}
                    onChange={(e) => handleFoodSelect(i, e.target.value)}
                  >
                    <option value="">— Choisir un aliment —</option>
                    {allFoods.map((f) => (
                      <option key={f.id} value={f.id}>{f.nom}</option>
                    ))}
                  </select>
                </div>
                <input
                  className="form-input"
                  style={{ maxWidth: 110 }}
                  type="number"
                  min={1}
                  value={item.quantiteGrammes}
                  onChange={(e) => updateItem(i, { quantiteGrammes: Number(e.target.value) })}
                  aria-label="Quantité en grammes"
                />
                <button type="button" className="btn-icon" onClick={() => removeItem(i)} aria-label="Supprimer">🗑️</button>
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <button type="button" className="btn btn-primary" onClick={handleConfirm} disabled={items.every((it) => !it.food)}>
              ✅ Ajouter ce repas
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setItems(null)}>
              ← Recommencer
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
