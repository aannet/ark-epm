export interface KpisSummary {
  appsCount: number | null;
  missionCriticalPercent: number | null;
  missionCriticalDenominator: number | null;
  interfacesCount: number | null;
  coveredCapabilitiesCount: number | null;
}

export interface IncompleteApp {
  id: string;
  name: string;
  missingFields: Array<'owner' | 'criticality' | 'lifecycle'>;
  businessCapability: {
    id: string;
    name: string;
    ancestors: Array<{ id: string; name: string }>;
  } | null;
  createdAt: string;
}

export interface ExpiringProvider {
  id: string;
  name: string;
  expiryDate: string;
  daysUntilExpiry: number;
}

export interface LifecycleDistribution {
  draft: number;
  in_progress: number;
  production: number;
  deprecated: number;
  retired: number;
  total: number;
}

export interface DataQualitySummary {
  completeCount: number;
  totalCount: number;
  scorePercent: number | null;
}

export interface HomeSummaryResponse {
  kpis: KpisSummary | null;
  incompleteApps: IncompleteApp[] | null;
  expiringProviders: ExpiringProvider[] | null;
  lifecycleDistribution: LifecycleDistribution | null;
  dataQuality: DataQualitySummary | null;
}
