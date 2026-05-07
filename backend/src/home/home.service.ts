import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  HomeSummaryDto,
  KpisDto,
  IncompleteAppDto,
  ExpiringProviderDto,
  LifecycleDistributionDto,
  DataQualityDto,
} from './dto/home-summary.dto';

// AGENT-DECISION: back — FS-12 D-03 : HomeService injecte PrismaService directement
// Pas d'import ApplicationsModule, BusinessCapabilitiesModule, etc. (évite dépendances circulaires)

const LIFECYCLE_STATUSES = ['draft', 'in_progress', 'production', 'deprecated', 'retired'] as const;
const EXPIRY_WINDOW_DAYS = 90;

@Injectable()
export class HomeService {
  private readonly logger = new Logger(HomeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string): Promise<HomeSummaryDto> {
    // RM-02 : récupérer les domainIds de l'utilisateur connecté
    const scopeRows = await this.prisma.userDomainScope.findMany({
      where: { userId },
      select: { domainId: true },
    });
    const domainIds = scopeRows.map((r) => r.domainId);

    // RM-01 : 0 domaine = portée globale
    const domainFilter = domainIds.length > 0 ? { domainId: { in: domainIds } } : {};

    // RM-03 : Promise.allSettled — erreur partielle → champ null
    const [kpisResult, incompleteResult, expiringResult, lifecycleResult, qualityResult] =
      await Promise.allSettled([
        this.computeKpis(domainFilter, domainIds),
        this.computeIncompleteApps(domainFilter),
        this.computeExpiringProviders(domainIds),
        this.computeLifecycleDistribution(domainFilter),
        this.computeDataQuality(domainFilter),
      ]);

    const resolve = <T>(result: PromiseSettledResult<T>, label: string): T | null => {
      if (result.status === 'rejected') {
        this.logger.error({ method: 'getSummary', section: label, error: result.reason?.message });
        return null;
      }
      return result.value;
    };

    return {
      kpis: resolve(kpisResult, 'kpis'),
      incompleteApps: resolve(incompleteResult, 'incompleteApps'),
      expiringProviders: resolve(expiringResult, 'expiringProviders'),
      lifecycleDistribution: resolve(lifecycleResult, 'lifecycleDistribution'),
      dataQuality: resolve(qualityResult, 'dataQuality'),
    };
  }

  // ─── KPIs ───────────────────────────────────────────────────────────────────

  private async computeKpis(
    domainFilter: Record<string, unknown>,
    domainIds: string[],
  ): Promise<KpisDto> {
    const [appsCount, missionCriticalCount, criticalitySetCount, interfacesCount, coveredCapabilities] =
      await Promise.all([
        // RM-04 : total apps dans le périmètre
        this.prisma.application.count({ where: domainFilter }),
        // RM-04 : numérateur mission-critical
        this.prisma.application.count({
          where: { ...domainFilter, criticality: 'mission-critical' },
        }),
        // RM-04 : dénominateur (criticality IS NOT NULL)
        this.prisma.application.count({
          where: { ...domainFilter, criticality: { not: null } },
        }),
        // RM-06 : interfaces global (entité transverse)
        this.prisma.interface.count(),
        // RM-05 : BC couvertes DISTINCT dans le périmètre
        this.prisma.appCapabilityMap.findMany({
          where: { application: domainFilter },
          select: { capabilityId: true },
          distinct: ['capabilityId'],
        }),
      ]);

    // RM-04 : si dénominateur = 0 → percent null
    const missionCriticalPercent =
      criticalitySetCount > 0
        ? Math.round((missionCriticalCount / criticalitySetCount) * 100)
        : null;

    return {
      appsCount,
      missionCriticalPercent,
      missionCriticalDenominator: criticalitySetCount,
      interfacesCount,
      coveredCapabilitiesCount: coveredCapabilities.length,
    };
  }

  // ─── Applications incomplètes ────────────────────────────────────────────────

  private async computeIncompleteApps(
    domainFilter: Record<string, unknown>,
  ): Promise<IncompleteAppDto[]> {
    // RM-07 : WHERE (owner IS NULL OR criticality IS NULL OR lifecycleStatus IS NULL), ORDER BY createdAt ASC, TAKE 5
    const apps = await this.prisma.application.findMany({
      where: {
        ...domainFilter,
        OR: [
          { ownerId: null },
          { criticality: null },
          { lifecycleStatus: null },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 5,
      select: { id: true, name: true, ownerId: true, criticality: true, lifecycleStatus: true, createdAt: true },
    });

    if (apps.length === 0) {
      return [];
    }

    const appIds = apps.map((app) => app.id);
    const appCapabilityMappings = await this.prisma.appCapabilityMap.findMany({
      where: { applicationId: { in: appIds } },
      select: { applicationId: true, capabilityId: true },
    });

    const businessCapabilities =
      appCapabilityMappings.length > 0
        ? await this.prisma.businessCapability.findMany({
            select: { id: true, name: true, parentId: true },
          })
        : [];

    // AGENT-DECISION: back — Widget fiches incomplètes : en N:N app<->BC,
    // on affiche la BC la plus profonde (plus contextuelle), tie-break stable name/id.
    const businessCapabilityById = new Map(
      businessCapabilities.map((capability) => [capability.id, capability]),
    );
    const capabilityPathCache = new Map<string, Array<{ id: string; name: string }>>();

    const buildCapabilityPath = (capabilityId: string): Array<{ id: string; name: string }> => {
      const cached = capabilityPathCache.get(capabilityId);
      if (cached) {
        return cached;
      }

      const lineage: Array<{ id: string; name: string }> = [];
      const visited = new Set<string>();
      let currentId: string | null = capabilityId;

      while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        const current = businessCapabilityById.get(currentId);
        if (!current) {
          break;
        }
        lineage.push({ id: current.id, name: current.name });
        currentId = current.parentId;
      }

      const path = lineage.reverse();
      capabilityPathCache.set(capabilityId, path);
      return path;
    };

    const capabilityIdsByAppId = new Map<string, string[]>();
    for (const mapping of appCapabilityMappings) {
      const current = capabilityIdsByAppId.get(mapping.applicationId) ?? [];
      current.push(mapping.capabilityId);
      capabilityIdsByAppId.set(mapping.applicationId, current);
    }

    return apps.map((app) => {
      const missingFields: IncompleteAppDto['missingFields'] = [];
      if (!app.ownerId) missingFields.push('owner');
      if (!app.criticality) missingFields.push('criticality');
      if (!app.lifecycleStatus) missingFields.push('lifecycle');

      const selectedCapabilityPath = (capabilityIdsByAppId.get(app.id) ?? [])
        .map((capabilityId) => buildCapabilityPath(capabilityId))
        .filter((path) => path.length > 0)
        .sort((left, right) => {
          const depthDiff = right.length - left.length;
          if (depthDiff !== 0) {
            return depthDiff;
          }

          const leftLeaf = left[left.length - 1]!;
          const rightLeaf = right[right.length - 1]!;
          const nameDiff = leftLeaf.name.localeCompare(rightLeaf.name, 'fr');
          if (nameDiff !== 0) {
            return nameDiff;
          }
          return leftLeaf.id.localeCompare(rightLeaf.id);
        })[0];

      const businessCapability = selectedCapabilityPath
        ? {
            ...selectedCapabilityPath[selectedCapabilityPath.length - 1],
            ancestors: selectedCapabilityPath.slice(0, -1),
          }
        : null;

      return {
        id: app.id,
        name: app.name,
        missingFields,
        businessCapability,
        createdAt: app.createdAt,
      };
    });
  }

  // ─── Fournisseurs expirants ──────────────────────────────────────────────────

  private async computeExpiringProviders(
    domainIds: string[],
  ): Promise<ExpiringProviderDto[]> {
    // RM-08 : expiryDate IS NOT NULL AND <= today + 90j, filtre domaine via apps liées
    const today = new Date();
    const cutoff = new Date(today.getTime() + EXPIRY_WINDOW_DAYS * 86_400_000);

    const domainFilter = domainIds.length > 0 ? { domainId: { in: domainIds } } : {};

    const providerMaps = await this.prisma.applicationProviderMap.findMany({
      where: {
        application: domainFilter,
        provider: {
          expiryDate: { not: null, lte: cutoff },
        },
      },
      select: {
        provider: { select: { id: true, name: true, expiryDate: true } },
      },
      orderBy: { provider: { expiryDate: 'asc' } },
      take: 5,
      distinct: ['providerId'],
    });

    return providerMaps.map(({ provider }) => ({
      id: provider.id,
      name: provider.name,
      expiryDate: provider.expiryDate!,
      // RM-08 : daysUntilExpiry = floor((expiryDate - today) / 1 day)
      daysUntilExpiry: Math.floor(
        (provider.expiryDate!.getTime() - today.getTime()) / 86_400_000,
      ),
    }));
  }

  // ─── Distribution lifecycle ──────────────────────────────────────────────────

  private async computeLifecycleDistribution(
    domainFilter: Record<string, unknown>,
  ): Promise<LifecycleDistributionDto> {
    // RM-09 : groupBy lifecycleStatus, tous les 5 statuts toujours présents
    const groups = await this.prisma.application.groupBy({
      by: ['lifecycleStatus'],
      where: domainFilter,
      _count: { _all: true },
    });

    const countMap: Record<string, number> = {};
    for (const g of groups) {
      if (g.lifecycleStatus) countMap[g.lifecycleStatus] = g._count._all;
    }

    const dist: LifecycleDistributionDto = {
      draft: countMap['draft'] ?? 0,
      in_progress: countMap['in_progress'] ?? 0,
      production: countMap['production'] ?? 0,
      deprecated: countMap['deprecated'] ?? 0,
      retired: countMap['retired'] ?? 0,
      total: 0,
    };
    dist.total = LIFECYCLE_STATUSES.reduce((sum, s) => sum + (dist[s] ?? 0), 0);

    return dist;
  }

  // ─── Data quality ────────────────────────────────────────────────────────────

  private async computeDataQuality(
    domainFilter: Record<string, unknown>,
  ): Promise<DataQualityDto> {
    // RM-10 : complètes = ownerId IS NOT NULL AND criticality IS NOT NULL AND lifecycleStatus IS NOT NULL
    const [completeCount, totalCount] = await Promise.all([
      this.prisma.application.count({
        where: {
          ...domainFilter,
          ownerId: { not: null },
          criticality: { not: null },
          lifecycleStatus: { not: null },
        },
      }),
      this.prisma.application.count({ where: domainFilter }),
    ]);

    return {
      completeCount,
      totalCount,
      scorePercent: totalCount > 0 ? Math.floor((completeCount / totalCount) * 100) : null,
    };
  }
}
