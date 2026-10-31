import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { listenForInstallPrompt } from './services/pwa/installPrompt';
import { registerServiceWorker } from './services/pwa/serviceWorker';
import './styles/global.css';

const container = document.getElementById('root');
if (!container) throw new Error('Elemento #root não encontrado.');

// Antes da renderização: o `beforeinstallprompt` pode disparar logo ao abrir a página.
listenForInstallPrompt();
if (import.meta.env.PROD) registerServiceWorker();

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
