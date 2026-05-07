import { Test, TestingModule } from '@nestjs/testing';
import { HomeService } from './home.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockPrisma = {
  userDomainScope: { findMany: jest.fn() },
  application: {
    count: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  interface: { count: jest.fn() },
  appCapabilityMap: { findMany: jest.fn() },
  businessCapability: { findMany: jest.fn() },
  applicationProviderMap: { findMany: jest.fn() },
};

// ─── Données de test ─────────────────────────────────────────────────────────

const DOMAIN_ID = 'd1111111-0000-0000-0000-000000000001';
const USER_ID   = 'u0000000-0000-0000-0000-000000000001';

function buildDefaultMocks(domainIds: string[] = []) {
  mockPrisma.userDomainScope.findMany.mockResolvedValue(
    domainIds.map((id) => ({ domainId: id })),
  );
  mockPrisma.application.count.mockResolvedValue(10);
  mockPrisma.application.findMany.mockResolvedValue([]);
  mockPrisma.application.groupBy.mockResolvedValue([
    { lifecycleStatus: 'production', _count: { _all: 10 } },
  ]);
  mockPrisma.interface.count.mockResolvedValue(5);
  mockPrisma.appCapabilityMap.findMany.mockImplementation((args?: { distinct?: string[]; where?: { applicationId?: { in: string[] } } }) => {
    if (args?.distinct) {
      return Promise.resolve([{ capabilityId: 'c1' }, { capabilityId: 'c2' }]);
    }
    if (args?.where?.applicationId?.in) {
      return Promise.resolve([]);
    }
    return Promise.resolve([]);
  });
  mockPrisma.businessCapability.findMany.mockResolvedValue([]);
  mockPrisma.applicationProviderMap.findMany.mockResolvedValue([]);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('HomeService', () => {
  let service: HomeService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<HomeService>(HomeService);
  });

  // G-03 : structure complète
  describe('getSummary', () => {
    it('retourne tous les champs avec user sans domaine (portée globale)', async () => {
      buildDefaultMocks([]);
      const result = await service.getSummary(USER_ID);

      expect(result).toHaveProperty('kpis');
      expect(result).toHaveProperty('incompleteApps');
      expect(result).toHaveProperty('expiringProviders');
      expect(result).toHaveProperty('lifecycleDistribution');
      expect(result).toHaveProperty('dataQuality');
    });

    it('user sans domaine → pas de clause domain_id dans count (portée globale)', async () => {
      buildDefaultMocks([]);
      await service.getSummary(USER_ID);

      // appsCount doit être appelé avec filtre vide {}
      const countCalls = mockPrisma.application.count.mock.calls;
      const firstCall = countCalls[0][0];
      expect(firstCall.where).not.toHaveProperty('domainId');
    });

    it('user avec domainIds → requête filtrée sur domain_id IN [...]', async () => {
      buildDefaultMocks([DOMAIN_ID]);
      await service.getSummary(USER_ID);

      const countCalls = mockPrisma.application.count.mock.calls;
      // Au moins un appel avec filtre domainId
      const hasDomainFilter = countCalls.some(
        (call: any[]) => call[0]?.where?.domainId?.in?.includes(DOMAIN_ID),
      );
      expect(hasDomainFilter).toBe(true);
    });

    // G-05 : erreur partielle → champ null, HTTP 200 garanti
    it('sous-call apps lève une erreur → kpis: null, autres champs présents', async () => {
      mockPrisma.userDomainScope.findMany.mockResolvedValue([]);
      // application.count rejette (simule un timeout)
      mockPrisma.application.count.mockRejectedValue(new Error('DB timeout'));
      mockPrisma.application.findMany.mockResolvedValue([]);
      mockPrisma.application.groupBy.mockResolvedValue([]);
      mockPrisma.interface.count.mockResolvedValue(0);
      mockPrisma.appCapabilityMap.findMany.mockResolvedValue([]);
      mockPrisma.businessCapability.findMany.mockResolvedValue([]);
      mockPrisma.applicationProviderMap.findMany.mockResolvedValue([]);

      const result = await service.getSummary(USER_ID);

      expect(result.kpis).toBeNull();
      expect(result.lifecycleDistribution).not.toBeNull();
    });

    // RM-04 : missionCriticalPercent null si dénominateur = 0
    it('aucune app avec criticité renseignée → missionCriticalPercent: null', async () => {
      buildDefaultMocks([]);
      // count[0] = appsCount, count[1] = missionCritical, count[2] = criticalitySet, count[3] = dataQuality complete, count[4] = dataQuality total
      mockPrisma.application.count
        .mockResolvedValueOnce(5)  // appsCount
        .mockResolvedValueOnce(0)  // missionCriticalCount
        .mockResolvedValueOnce(0)  // criticalitySetCount = 0 → null
        .mockResolvedValueOnce(5)  // dataQuality completeCount
        .mockResolvedValueOnce(5); // dataQuality totalCount

      const result = await service.getSummary(USER_ID);

      expect(result.kpis?.missionCriticalPercent).toBeNull();
      expect(result.kpis?.missionCriticalDenominator).toBe(0);
    });

    // G-04 : lifecycleDistribution toujours 5 statuts
    it('lifecycleDistribution contient toujours les 5 statuts (0 si absent)', async () => {
      buildDefaultMocks([]);
      // groupBy ne retourne que 'production'
      mockPrisma.application.groupBy.mockResolvedValue([
        { lifecycleStatus: 'production', _count: { _all: 8 } },
      ]);

      const result = await service.getSummary(USER_ID);
      const dist = result.lifecycleDistribution!;

      expect(dist).toHaveProperty('draft', 0);
      expect(dist).toHaveProperty('in_progress', 0);
      expect(dist).toHaveProperty('production', 8);
      expect(dist).toHaveProperty('deprecated', 0);
      expect(dist).toHaveProperty('retired', 0);
      expect(dist.total).toBe(8);
    });

    // RM-07 : max 5 incomplètes
    it('incompleteApps contient au maximum 5 éléments', async () => {
      buildDefaultMocks([]);
      // findMany retourne déjà au max 5 (TAKE 5 dans le service)
      // on simule 2 résultats
      mockPrisma.application.findMany.mockResolvedValue([
        { id: 'a1', name: 'App 1', ownerId: null, criticality: null, lifecycleStatus: null, createdAt: new Date() },
        { id: 'a2', name: 'App 2', ownerId: 'u1', criticality: null, lifecycleStatus: null, createdAt: new Date() },
      ]);

      const result = await service.getSummary(USER_ID);

      expect(result.incompleteApps).toHaveLength(2);
      expect(result.incompleteApps![0].missingFields).toContain('owner');
      expect(result.incompleteApps![1].missingFields).not.toContain('owner');
      expect(result.incompleteApps![0].businessCapability).toBeNull();
    });

    it('incompleteApps sélectionne la BC la plus profonde avec tie-break stable', async () => {
      buildDefaultMocks([]);

      mockPrisma.application.findMany.mockResolvedValue([
        { id: 'a1', name: 'App 1', ownerId: null, criticality: null, lifecycleStatus: null, createdAt: new Date() },
      ]);

      mockPrisma.appCapabilityMap.findMany.mockImplementation((args?: { distinct?: string[]; where?: { applicationId?: { in: string[] } } }) => {
        if (args?.distinct) {
          return Promise.resolve([{ capabilityId: 'c1' }]);
        }
        if (args?.where?.applicationId?.in) {
          return Promise.resolve([
            { applicationId: 'a1', capabilityId: 'bc-shallow' },
            { applicationId: 'a1', capabilityId: 'bc-deep-finance' },
            { applicationId: 'a1', capabilityId: 'bc-deep-architecture' },
          ]);
        }
        return Promise.resolve([]);
      });

      mockPrisma.businessCapability.findMany.mockResolvedValue([
        { id: 'bc-root', name: 'Strategy', parentId: null },
        { id: 'bc-mid', name: 'Operations', parentId: 'bc-root' },
        { id: 'bc-shallow', name: 'Shared Services', parentId: 'bc-root' },
        { id: 'bc-deep-finance', name: 'Finance', parentId: 'bc-mid' },
        { id: 'bc-deep-architecture', name: 'Architecture', parentId: 'bc-mid' },
      ]);

      const result = await service.getSummary(USER_ID);

      expect(result.incompleteApps).toHaveLength(1);
      expect(result.incompleteApps![0].businessCapability).toEqual({
        id: 'bc-deep-architecture',
        name: 'Architecture',
        ancestors: [
          { id: 'bc-root', name: 'Strategy' },
          { id: 'bc-mid', name: 'Operations' },
        ],
      });
    });

    // RM-08 : daysUntilExpiry calculé correctement
    it('daysUntilExpiry calculé en jours entiers depuis aujourd\'hui', async () => {
      buildDefaultMocks([]);
      const futureDate = new Date(Date.now() + 10 * 86_400_000); // +10 jours
      mockPrisma.applicationProviderMap.findMany.mockResolvedValue([
        {
          provider: {
            id: 'p1',
            name: 'Provider A',
            expiryDate: futureDate,
          },
        },
      ]);

      const result = await service.getSummary(USER_ID);

      expect(result.expiringProviders).toHaveLength(1);
      expect(result.expiringProviders![0].daysUntilExpiry).toBe(10);
    });

    // D-02 : AuthService.getProfile — domainIds + domains
    it('kpis.appsCount est un entier >= 0', async () => {
      buildDefaultMocks([]);
      mockPrisma.application.count.mockResolvedValue(0);

      const result = await service.getSummary(USER_ID);

      expect(typeof result.kpis?.appsCount).toBe('number');
      expect(result.kpis!.appsCount).toBeGreaterThanOrEqual(0);
    });

    // RM-10 : scorePercent null si totalCount = 0
    it('dataQuality.scorePercent: null si aucune application', async () => {
      buildDefaultMocks([]);
      mockPrisma.application.count
        .mockResolvedValueOnce(0) // appsCount
        .mockResolvedValueOnce(0) // missionCriticalCount
        .mockResolvedValueOnce(0) // criticalitySetCount
        .mockResolvedValueOnce(0) // completeCount
        .mockResolvedValueOnce(0); // totalCount

      const result = await service.getSummary(USER_ID);

      expect(result.dataQuality?.scorePercent).toBeNull();
    });
  });
});
