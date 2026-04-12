import { TFunction } from 'i18next';

export function format409Message(t: TFunction, applicationsCount: number): string {
  return t('data-objects.delete.blockedMessage', { count: applicationsCount });
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(dateString));
}
