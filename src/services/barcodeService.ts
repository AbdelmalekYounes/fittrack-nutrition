// Service dédié à l'accès caméra et à la détection de code-barres dans le navigateur.
// Utilise la librairie @zxing/library (décodage par analyse d'image en pur JavaScript) afin
// de fonctionner sur TOUS les navigateurs avec caméra (Chrome, Firefox, Safari iOS/macOS...),
// contrairement à l'API native `BarcodeDetector` qui n'est disponible que sur Chrome/Edge.
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

export function isCameraSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
}

export interface BarcodeScanHandle {
  stop: () => void;
}

/** Choisit la caméra arrière si plusieurs sont disponibles (libellé contenant "back"/"arrière"
 * sur la plupart des appareils mobiles), sinon la dernière caméra listée (souvent la caméra
 * arrière sur mobile), sinon la première disponible. */
async function pickRearCameraId(reader: BrowserMultiFormatReader): Promise<string | undefined> {
  const devices = await reader.listVideoInputDevices();
  if (devices.length === 0) return undefined;
  const rear = devices.find((d) => /back|arri[eè]re|rear|environment/i.test(d.label));
  return (rear ?? devices[devices.length - 1]).deviceId;
}

/** Démarre la détection continue de code-barres sur l'élément vidéo fourni. `onDetected` est
 * appelé avec le code dès qu'un code-barres valide est lu ; `onError` en cas d'échec d'accès
 * à la caméra (permission refusée, aucune caméra, etc.). Le scan continue jusqu'à `stop()`. */
export async function startBarcodeScan(
  videoEl: HTMLVideoElement,
  onDetected: (code: string) => void,
  onError: (message: string) => void
): Promise<BarcodeScanHandle> {
  const reader = new BrowserMultiFormatReader();
  try {
    const deviceId = await pickRearCameraId(reader);
    await reader.decodeFromVideoDevice(deviceId, videoEl, (result, err) => {
      if (result) {
        onDetected(result.getText());
      } else if (err && !(err instanceof NotFoundException)) {
        // NotFoundException = aucun code détecté sur cette frame, ce n'est pas une erreur :
        // ZXing l'émet en continu tant qu'aucun code-barres n'est dans le champ de la caméra.
        onError('La lecture du flux vidéo a échoué.');
      }
    });
  } catch {
    onError("Impossible d'accéder à la caméra (permission refusée ou indisponible).");
  }
  return { stop: () => reader.reset() };
}
