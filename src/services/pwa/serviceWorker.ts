/**
 * Registra o service worker de `public/sw.js` (PWA manual — ver DT-015).
 * Caminho e escopo relativos ao documento: funciona na raiz e em subcaminhos (GitHub Pages /Money_App/).
 * Chamado apenas no build de produção, para não interferir no HMR do Vite em desenvolvimento.
 */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
      // Sem service worker o app continua funcionando online; apenas não fica disponível offline.
    });
  });
}
