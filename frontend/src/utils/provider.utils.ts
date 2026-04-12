import { TFunction } from 'i18next';

export function format409Message(t: TFunction, applicationsCount: number): string {
  return t('providers.alert.deleteBlocked', { count: applicationsCount });
}

export function resolveAlertMessage(t: TFunction, status: number, _code?: string): string {
  if (status === 404) {
    return t('providers.alert.errors.notFound');
  }
  if (status >= 500) {
    return t('providers.alert.errors.serverError');
  }
  return t('providers.alert.errors.serverError');
}
