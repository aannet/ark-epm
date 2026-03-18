import { TFunction } from 'i18next';
import { ApplicationDependencies } from '@/types/application';

export function format409Message(
  t: TFunction,
  counts: ApplicationDependencies['counts'],
): string {
  return t('applications.delete.blockedMessage', {
    capabilities: counts.capabilities,
    dataObjects: counts.dataObjects,
    itComponents: counts.itComponents,
    sourceInterfaces: counts.sourceInterfaces,
    targetInterfaces: counts.targetInterfaces,
  });
}

export function resolveAlertMessage(
  t: TFunction,
  status: number,
  _code?: string,
): string {
  if (status === 404) return t('applications.alert.errors.notFound');
  if (status >= 500) return t('applications.alert.errors.serverError');
  return t('applications.alert.errors.unknown');
}
