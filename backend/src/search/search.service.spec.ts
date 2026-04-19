import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  QuerySearchDto,
  SearchableEntityType,
} from './dto/query-search.dto';

// Mock PrismaService
const mockPrismaService = {
  application: { findMany: jest.fn() },
  domain: { findMany: jest.fn() },
  businessCapability: { findMany: jest.fn() },
  provider: { findMany: jest.fn() },
  itComponent: { findMany: jest.fn() },
  dataObject: { findMany: jest.fn() },
  interface: { findMany: jest.fn() },
};

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('calculateScore', () => {
    it('should return 10 for exact match', () => {
      expect(service.calculateScore('CRM Salesforce', null, 'crm salesforce')).toBe(10);
      expect(service.calculateScore('CRM', null, 'CRM')).toBe(10);
    });

    it('should return 9 for prefix match', () => {
      expect(service.calculateScore('CRM Salesforce', null, 'crm')).toBe(9);
      expect(service.calculateScore('SalesForce', null, 'sales')).toBe(9);
    });

    it('should return 5 for substring match', () => {
      expect(service.calculateScore('My CRM App', null, 'crm')).toBe(5);
      expect(service.calculateScore('SalesForce', null, 'force')).toBe(5);
    });

    it('should return 1 for description match', () => {
      expect(service.calculateScore('App', 'CRM system', 'crm')).toBe(1);
      expect(service.calculateScore('Sales', 'For salesforce integration', 'salesforce')).toBe(1);
    });

    it('should return 0 for no match', () => {
      expect(service.calculateScore('App', 'Description', 'xyz')).toBe(0);
    });
  });

  describe('search', () => {
    const mockApps = [
      { id: 'app-1', name: 'CRM Salesforce', description: 'Main CRM', domain: null, criticality: 'HIGH', lifecycleStatus: 'PRODUCTION' },
    ];
    const mockDomains = [
      { id: 'dom-1', name: 'Sales', description: 'Sales domain' },
    ];

    it('should throw BadRequestException for query < 2 characters', async () => {
      const query: QuerySearchDto = { q: 'a' };
      await expect(service.search(query)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for whitespace-only query', async () => {
      const query: QuerySearchDto = { q: '  ' };
      await expect(service.search(query)).rejects.toThrow(BadRequestException);
    });

    it('should return empty array if no results', async () => {
      mockPrismaService.application.findMany.mockResolvedValue([]);
      mockPrismaService.domain.findMany.mockResolvedValue([]);
      mockPrismaService.businessCapability.findMany.mockResolvedValue([]);
      mockPrismaService.provider.findMany.mockResolvedValue([]);
      mockPrismaService.itComponent.findMany.mockResolvedValue([]);
      mockPrismaService.dataObject.findMany.mockResolvedValue([]);
      mockPrismaService.interface.findMany.mockResolvedValue([]);

      const result = await service.search({ q: 'xyz' });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.query).toBe('xyz');
    });

    it('should search all entity types by default', async () => {
      mockPrismaService.application.findMany.mockResolvedValue(mockApps);
      mockPrismaService.domain.findMany.mockResolvedValue(mockDomains);
      mockPrismaService.businessCapability.findMany.mockResolvedValue([]);
      mockPrismaService.provider.findMany.mockResolvedValue([]);
      mockPrismaService.itComponent.findMany.mockResolvedValue([]);
      mockPrismaService.dataObject.findMany.mockResolvedValue([]);
      mockPrismaService.interface.findMany.mockResolvedValue([]);

      const result = await service.search({ q: 'crm' });

      expect(mockPrismaService.application.findMany).toHaveBeenCalled();
      expect(mockPrismaService.domain.findMany).toHaveBeenCalled();
      expect(result.meta.types).toContain(SearchableEntityType.APPLICATION);
      expect(result.meta.types).toContain(SearchableEntityType.DOMAIN);
    });

    it('should filter by types if provided', async () => {
      mockPrismaService.application.findMany.mockResolvedValue(mockApps);

      const result = await service.search({
        q: 'crm',
        types: [SearchableEntityType.APPLICATION],
      });

      expect(mockPrismaService.application.findMany).toHaveBeenCalled();
      expect(mockPrismaService.domain.findMany).not.toHaveBeenCalled();
      expect(result.meta.types).toEqual([SearchableEntityType.APPLICATION]);
    });

    it('should sort results by score descending', async () => {
      const apps = [
        { id: 'app-1', name: 'CRM', description: null, domain: null, criticality: null, lifecycleStatus: null },
        { id: 'app-2', name: 'My CRM App', description: null, domain: null, criticality: null, lifecycleStatus: null },
      ];
      mockPrismaService.application.findMany.mockResolvedValue(apps);
      mockPrismaService.domain.findMany.mockResolvedValue([]);
      mockPrismaService.businessCapability.findMany.mockResolvedValue([]);
      mockPrismaService.provider.findMany.mockResolvedValue([]);
      mockPrismaService.itComponent.findMany.mockResolvedValue([]);
      mockPrismaService.dataObject.findMany.mockResolvedValue([]);
      mockPrismaService.interface.findMany.mockResolvedValue([]);

      const result = await service.search({ q: 'crm', types: [SearchableEntityType.APPLICATION] });

      // CRM should have score 10 (exact match), My CRM App should have score 5 (contains)
      expect(result.data[0].score).toBe(10);
      expect(result.data[1].score).toBe(5);
    });

    it('should respect limit parameter', async () => {
      const manyApps = Array(50).fill(null).map((_, i) => ({
        id: `app-${i}`,
        name: `CRM App ${i}`,
        description: null,
        domain: null,
        criticality: null,
        lifecycleStatus: null,
      }));
      mockPrismaService.application.findMany.mockResolvedValue(manyApps);
      mockPrismaService.domain.findMany.mockResolvedValue([]);
      mockPrismaService.businessCapability.findMany.mockResolvedValue([]);
      mockPrismaService.provider.findMany.mockResolvedValue([]);
      mockPrismaService.itComponent.findMany.mockResolvedValue([]);
      mockPrismaService.dataObject.findMany.mockResolvedValue([]);
      mockPrismaService.interface.findMany.mockResolvedValue([]);

      const result = await service.search({ q: 'crm', limit: 5 });

      expect(result.data.length).toBeLessThanOrEqual(5);
      expect(result.meta.limit).toBe(5);
    });
  });
});
