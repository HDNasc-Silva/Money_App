import type { BadgeTone } from '@/components/common/Badge';
import type { SubscriptionStatus } from '@/domain/subscriptions';

/**
 * Sugestões rápidas do formulário: preenchem apenas nome e ícone.
 * Não há preços: o valor depende do plano de cada pessoa e muda com frequência.
 */
export const SUBSCRIPTION_SUGGESTIONS: readonly { name: string; icon: string }[] = [
  { name: 'Netflix', icon: 'live_tv' },
  { name: 'Spotify', icon: 'library_music' },
  { name: 'Amazon Prime', icon: 'local_shipping' },
  { name: 'Claude', icon: 'smart_toy' },
  { name: 'ChatGPT', icon: 'auto_awesome' },
  { name: 'YouTube Premium', icon: 'play_circle' },
  { name: 'Disney+', icon: 'movie' },
  { name: 'iCloud+', icon: 'cloud' },
  { name: 'Google One', icon: 'cloud' },
  { name: 'Xbox Game Pass', icon: 'sports_esports' },
];

export const STATUS_BADGES: Record<SubscriptionStatus, { label: string; tone: BadgeTone; icon: string }> = {
  active: { label: 'Ativa', tone: 'income', icon: 'check_circle' },
  paused: { label: 'Pausada', tone: 'warning', icon: 'pause_circle' },
  ended: { label: 'Encerrada', tone: 'neutral', icon: 'block' },
};
