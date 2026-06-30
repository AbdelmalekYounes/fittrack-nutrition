import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Enregistrement du service worker (PWA) : permet l'installation sur l'écran d'accueil
// et un fonctionnement hors-ligne basique. Échoue silencieusement si non supporté.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Pas bloquant : l'app reste utilisable normalement sans service worker.
    });
  });
}
