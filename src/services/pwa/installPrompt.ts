/**
 * Captura o evento `beforeinstallprompt` (Chrome/Edge/Android) para oferecer o botão "Instalar app".
 * O evento costuma disparar logo ao abrir a página, antes de Ajustes ser exibido; por isso é
 * guardado num store de módulo, iniciado em `main.tsx`, e lido pela interface via `subscribe`.
 */

/** Evento não padronizado (ainda fora do lib.dom do TypeScript). */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
let listening = false;

const notify = () => listeners.forEach((listener) => listener());

export function listenForInstallPrompt(): void {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installed = true;
    notify();
  });
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const canPromptInstall = (): boolean => deferredPrompt !== null;

/** Abre o diálogo nativo de instalação; o evento só pode ser usado uma vez. */
export async function promptInstall(): Promise<InstallOutcome> {
  const event = deferredPrompt;
  if (!event) return 'unavailable';
  deferredPrompt = null;
  notify();
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome;
}

/** O app já está aberto como aplicativo instalado (tela cheia, sem barra do navegador). */
export function isRunningStandalone(): boolean {
  if (installed) return true;
  const standaloneMedia = typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standaloneMedia || iosStandalone;
}

/** iPhone/iPad (inclui iPadOS, que se identifica como Mac com toque): instalação só pelo menu Compartilhar. */
export function isAppleMobile(): boolean {
  const { userAgent, maxTouchPoints } = navigator;
  return /iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1);
}
