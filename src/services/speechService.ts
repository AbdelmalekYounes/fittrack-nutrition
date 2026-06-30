// Service de reconnaissance vocale : encapsule l'API native du navigateur (Web Speech API,
// disponible sur Chrome/Edge/Safari récents — aucune dépendance externe). Si l'API n'est pas
// disponible, isSpeechRecognitionSupported() renvoie false et l'appelant doit proposer une
// saisie texte équivalente (voir VoiceMealEntry.tsx).

interface SpeechRecognitionResultLike {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}
interface SpeechRecognitionErrorLike {
  error: string;
}
interface MinimalSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionResultLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => MinimalSpeechRecognition;
    webkitSpeechRecognition?: new () => MinimalSpeechRecognition;
  }
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export interface SpeechSession {
  stop: () => void;
}

/** Démarre une écoute vocale en français. `onResult` reçoit le texte final transcrit une
 * fois la phrase terminée ; `onError` est appelé en cas d'échec (micro refusé, silence...). */
export function startSpeechRecognition(
  onResult: (transcript: string) => void,
  onError: (message: string) => void
): SpeechSession | null {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.lang = 'fr-FR';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript ?? '';
    onResult(transcript);
  };
  recognition.onerror = (event) => {
    onError(
      event.error === 'not-allowed'
        ? 'Accès au microphone refusé. Utilisez la saisie texte ci-dessous.'
        : "La reconnaissance vocale n'a rien détecté. Réessayez ou utilisez la saisie texte."
    );
  };

  recognition.start();
  return { stop: () => recognition.stop() };
}
