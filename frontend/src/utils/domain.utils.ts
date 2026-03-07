import { TFunction } from 'i18next';

export function format409Message(
  t: TFunction,
  appCount: number,
  bcCount: number,
): string {
  const apps = appCount === 0 ? 'no' : appCount;
  const bcs = bcCount === 0 ? 'no' : bcCount;
  return t('domains.delete.blockedMessage', { apps, bcs });
}

export function resolveAlertMessage(
  t: TFunction,
  status: number,
  _code?: string,
): string {
  if (status === 404) return t('domains.alert.errors.notFound');
  if (status >= 500) return t('domains.alert.errors.serverError');
  return t('domains.alert.errors.unknown');
}
