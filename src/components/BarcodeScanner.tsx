import { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import { useAppData } from '../hooks/useAppData';
import { lookupProductByBarcode, type ProductLookupResult } from '../services/openFoodFactsService';
import { isCameraSupported, isBarcodeDetectionSupported, startCameraStream, stopCameraStream, detectBarcodeFromVideo } from '../services/barcodeService';
import type { FoodItem } from '../types';

const NUTRISCORE_COLORS: Record<string, string> = {
  a: '#16a34a',
  b: '#65a30d',
  c: '#f59e0b',
  d: '#ea580c',
  e: '#dc2626',
};

interface BarcodeScannerProps {
  onClose: () => void;
  onAddFood: (food: FoodItem, quantiteGrammes: number) => void;
}

/** Modal "Scanner un produit" : caméra + détection de code-barres si le navigateur le
 * permet (API native BarcodeDetector, sans dépendance externe), avec saisie manuelle du
 * code-barres toujours disponible en repli. Interroge OpenFoodFacts puis permet d'ajouter
 * le produit au repas et/ou de le sauvegarder dans les favoris. */
export default function BarcodeScanner({ onClose, onAddFood }: BarcodeScannerProps) {
  const { addCustomFood, toggleFavorite, favorites } = useAppData();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProductLookupResult | null>(null);
  const [quantite, setQuantite] = useState(100);

  const cameraSupported = isCameraSupported();
  const detectionSupported = isBarcodeDetectionSupported();

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) window.clearInterval(scanIntervalRef.current);
      stopCameraStream(streamRef.current);
    };
  }, []);

  async function handleStartCamera() {
    setCameraError(null);
    try {
      const stream = await startCameraStream(videoRef.current!);
      streamRef.current = stream;
      setCameraActive(true);
      scanIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current) return;
        const code = await detectBarcodeFromVideo(videoRef.current);
        if (code) {
          handleStopCamera();
          handleLookup(code);
        }
      }, 600);
    } catch {
      setCameraError("Impossible d'accéder à la caméra (permission refusée ou indisponible). Utilisez la saisie manuelle ci-dessous.");
    }
  }

  function handleStopCamera() {
    if (scanIntervalRef.current) window.clearInterval(scanIntervalRef.current);
    stopCameraStream(streamRef.current);
    streamRef.current = null;
    setCameraActive(false);
  }

  async function handleLookup(barcode: string) {
    setLoading(true);
    setResult(null);
    const lookup = await lookupProductByBarcode(barcode);
    setResult(lookup);
    setLoading(false);
  }

  const product = result && (result.status === 'ok' || result.status === 'incomplete') ? result.food : null;
  const isFavorite = product ? favorites.includes(product.id) : false;

  return (
    <Modal title="Scanner un produit" onClose={onClose}>
      {!product && (
        <>
          {cameraSupported && detectionSupported ? (
            <div className="section">
              {!cameraActive ? (
                <button type="button" className="btn btn-primary" onClick={handleStartCamera}>
                  📷 Activer la caméra
                </button>
              ) : (
                <button type="button" className="btn btn-outline" onClick={handleStopCamera}>
                  Arrêter la caméra
                </button>
              )}
              <video ref={videoRef} className="barcode-video" style={{ display: cameraActive ? 'block' : 'none' }} muted playsInline />
              {cameraError && <p className="form-error">{cameraError}</p>}
            </div>
          ) : (
            <p className="text-muted section">
              {cameraSupported
                ? 'La détection de code-barres n\'est pas supportée par ce navigateur. Utilisez la saisie manuelle ci-dessous.'
                : "Aucune caméra détectée sur cet appareil. Utilisez la saisie manuelle ci-dessous."}
            </p>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="manualBarcode">Saisir le code-barres manuellement</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                id="manualBarcode"
                className="form-input"
                type="text"
                inputMode="numeric"
                placeholder="Ex: 3017620422003"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
              />
              <button type="button" className="btn btn-primary" onClick={() => handleLookup(manualCode)} disabled={!manualCode.trim() || loading}>
                {loading ? 'Recherche...' : 'Rechercher'}
              </button>
            </div>
          </div>

          {result && result.status === 'invalid_barcode' && (
            <p className="form-error">Code-barres invalide : il doit contenir entre 6 et 14 chiffres.</p>
          )}
          {result && result.status === 'not_found' && (
            <p className="form-error">Produit introuvable dans OpenFoodFacts. Vous pouvez l'ajouter manuellement depuis l'onglet « Saisie manuelle » de la page Nutrition.</p>
          )}
          {result && result.status === 'network_error' && (
            <div>
              <p className="form-error">L'API OpenFoodFacts ne répond pas pour le moment. Vérifiez votre connexion.</p>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => handleLookup(manualCode)}>Réessayer</button>
            </div>
          )}
        </>
      )}

      {product && (
        <div>
          {result?.status === 'incomplete' && (
            <p className="form-error">
              Données incomplètes pour ce produit (manquant : {(result as { missing: string[] }).missing.join(', ')}). Vérifiez avant d'ajouter.
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>{product.nom}</h3>
            {product.nutriScore && (
              <span
                className="badge"
                style={{ backgroundColor: NUTRISCORE_COLORS[product.nutriScore] ?? 'var(--color-bg)', color: '#fff' }}
              >
                Nutri-Score {product.nutriScore.toUpperCase()}
              </span>
            )}
          </div>

          <p className="text-muted">Pour 100g : {product.caloriesPour100g} kcal · P {product.proteinesPour100g}g · G {product.glucidesPour100g}g · L {product.lipidesPour100g}g · Fibres {product.fibresPour100g}g{product.selPour100g !== undefined ? ` · Sel ${product.selPour100g}g` : ''}</p>

          {product.allergenes && product.allergenes.length > 0 && (
            <p><strong>Allergènes :</strong> {product.allergenes.join(', ')}</p>
          )}
          {product.ingredientsTexte && (
            <p className="text-muted"><strong>Ingrédients :</strong> {product.ingredientsTexte}</p>
          )}

          <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
            <label className="form-label" htmlFor="scanQuantite">Quantité (g)</label>
            <input
              id="scanQuantite"
              className="form-input"
              type="number"
              min={1}
              value={quantite}
              onChange={(e) => setQuantite(Number(e.target.value))}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                addCustomFood(product);
                onAddFood(product, quantite);
                onClose();
              }}
            >
              ✅ Ajouter au repas
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                addCustomFood(product);
                if (!isFavorite) toggleFavorite(product.id);
              }}
            >
              {isFavorite ? '★ Dans les favoris' : '☆ Ajouter aux favoris'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => { setResult(null); setManualCode(''); }}>
              Scanner un autre produit
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
