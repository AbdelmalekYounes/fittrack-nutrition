// Service dédié à l'accès caméra et à la détection de code-barres dans le navigateur.
// Utilise l'API native `BarcodeDetector` (disponible sur Chrome/Edge/Android — pas de
// dépendance externe ajoutée) avec repli explicite : si la caméra ou la détection ne sont
// pas supportées, le composant appelant doit proposer la saisie manuelle du code-barres.

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => {
      detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
    };
  }
}

export function isCameraSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
}

export function isBarcodeDetectionSupported(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

/** Démarre le flux caméra arrière (si disponible) et l'attache à l'élément vidéo fourni. */
export async function startCameraStream(videoEl: HTMLVideoElement): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' },
    audio: false,
  });
  videoEl.srcObject = stream;
  await videoEl.play();
  return stream;
}

export function stopCameraStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

/** Tente de détecter un code-barres dans l'image vidéo courante. Retourne `null` si
 * aucun code n'est détecté sur cette frame (pas une erreur : on réessaiera à la frame suivante). */
export async function detectBarcodeFromVideo(videoEl: HTMLVideoElement): Promise<string | null> {
  if (!window.BarcodeDetector) return null;
  try {
    const detector = new window.BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'],
    });
    const results = await detector.detect(videoEl);
    return results[0]?.rawValue ?? null;
  } catch {
    return null;
  }
}
