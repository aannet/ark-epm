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
