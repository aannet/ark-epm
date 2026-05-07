// AGENT-DECISION: back — FS-12 D-03 : DTOs BFF HomeSummary — PrismaService direct, pas d'import modules feature

export interface IncompleteAppDto {
  id: string;
  name: string;
  missingFields: ('owner' | 'criticality' | 'lifecycle')[];
  businessCapability: {
    id: string;
    name: string;
    ancestors: Array<{ id: string; name: string }>;
  } | null;
  createdAt: Date | null;
}

export interface ExpiringProviderDto {
  id: string;
  name: string;
  expiryDate: Date;
  daysUntilExpiry: number;
}

export interface LifecycleDistributionDto {
  draft: number;
  in_progress: number;
  production: number;
  deprecated: number;
  retired: number;
  total: number;
}

export interface KpisDto {
  appsCount: number;
  missionCriticalPercent: number | null;
  missionCriticalDenominator: number;
  interfacesCount: number;
  coveredCapabilitiesCount: number;
}

export interface DataQualityDto {
  completeCount: number;
  totalCount: number;
  scorePercent: number | null;
}

export class HomeSummaryDto {
  kpis: KpisDto | null;
  incompleteApps: IncompleteAppDto[] | null;
  expiringProviders: ExpiringProviderDto[] | null;
  lifecycleDistribution: LifecycleDistributionDto | null;
  dataQuality: DataQualityDto | null;
}
