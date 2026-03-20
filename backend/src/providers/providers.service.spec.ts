import { Test, TestingModule } from '@nestjs/testing';
import { ProvidersService } from './providers.service';
import { PrismaService } from '../prisma/prisma.service';
import { TagsService } from '../tags/tags.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('ProvidersService', () => {
  let service: ProvidersService;
  let prisma: jest.Mocked<PrismaService>;
  let tagsService: jest.Mocked<TagsService>;

  const mockProvider = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Salesforce',
    description: 'CRM cloud leader',
    comment: 'Main SaaS provider',
    contractType: 'SaaS',
    expiryDate: new Date('2026-12-31'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      provider: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      application: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      setCurrentUser: jest.fn(),
      $executeRaw: jest.fn(),
    };

    const mockTagsService = {
      getEntityTags: jest.fn(),
      getEntitiesTags: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProvidersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TagsService,
          useValue: mockTagsService,
        },
      ],
    }).compile();

    service = module.get<ProvidersService>(ProvidersService);
    prisma = module.get(PrismaService);
    tagsService = module.get(TagsService);
  });

  describe('findAll', () => {
    it('should return paginated list of providers with _count.applications', async () => {
      prisma.provider.count.mockResolvedValue(1);
      prisma.provider.findMany.mockResolvedValue([
        { ...mockProvider, _count: { applications: 5 } },
      ]);
      tagsService.getEntitiesTags.mockResolvedValue([]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]._count.applications).toBe(5);
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
      expect(prisma.provider.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { name: 'asc' },
        include: { _count: { select: { applications: true } } },
      });
    });

    it('should apply search filter on name', async () => {
      prisma.provider.count.mockResolvedValue(0);
      prisma.provider.findMany.mockResolvedValue([]);

      await service.findAll({ page: 1, limit: 20, search: 'sales' });

      expect(prisma.provider.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { contains: 'sales', mode: 'insensitive' } },
        }),
      );
    });

    it('should return empty data array when no providers exist', async () => {
      prisma.provider.count.mockResolvedValue(0);
      prisma.provider.findMany.mockResolvedValue([]);

      const result = await service.findAll({});

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      // Note: tagsService.getEntitiesTags IS called with empty array - this is fine
    });

    it('should load tags via batch call', async () => {
      const provider1 = { ...mockProvider, id: 'provider-1' };
      const provider2 = { ...mockProvider, id: 'provider-2', name: 'SAP' };
      prisma.provider.count.mockResolvedValue(2);
      prisma.provider.findMany.mockResolvedValue([
        { ...provider1, _count: { applications: 3 } },
        { ...provider2, _count: { applications: 0 } },
      ]);

      const mockTags = [
        {
          entityType: 'provider',
          entityId: 'provider-1',
          tagValue: {
            id: 'tag-1',
            dimensionId: 'dim-1',
            dimensionName: 'Geography',
            dimensionColor: '#2196F3',
            path: 'europe/france',
            label: 'France',
            depth: 1,
            parentId: null,
          },
          taggedAt: new Date(),
        },
      ];
      tagsService.getEntitiesTags.mockResolvedValue(mockTags);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(2);
      expect(result.data[0].tags).toHaveLength(1);
      expect(result.data[0].tags[0].label).toBe('France');
      expect(result.data[1].tags).toHaveLength(0);
      expect(tagsService.getEntitiesTags).toHaveBeenCalledWith('provider', ['provider-1', 'provider-2']);
    });
  });

  describe('findOne', () => {
    it('should return provider with _count.applications and tags', async () => {
      prisma.provider.findUnique.mockResolvedValue({
        ...mockProvider,
        _count: { applications: 5 },
      });
      tagsService.getEntityTags.mockResolvedValue([]);

      const result = await service.findOne(mockProvider.id);

      expect(result._count.applications).toBe(5);
      expect(result.tags).toEqual([]);
      expect(prisma.provider.findUnique).toHaveBeenCalledWith({
        where: { id: mockProvider.id },
        include: { _count: { select: { applications: true } } },
      });
    });

    it('should return provider with tags', async () => {
      prisma.provider.findUnique.mockResolvedValue({
        ...mockProvider,
        _count: { applications: 0 },
      });

      const mockTags = [
        {
          entityType: 'provider',
          entityId: mockProvider.id,
          tagValue: {
            id: 'tag-1',
            dimensionId: 'dim-1',
            dimensionName: 'Geography',
            dimensionColor: '#2196F3',
            path: 'europe/france',
            label: 'France',
            depth: 1,
            parentId: null,
          },
          taggedAt: new Date(),
        },
      ];
      tagsService.getEntityTags.mockResolvedValue(mockTags);

      const result = await service.findOne(mockProvider.id);

      expect(result.tags).toHaveLength(1);
      expect(result.tags[0].label).toBe('France');
    });

    it('should throw NotFoundException when provider not found', async () => {
      prisma.provider.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a provider', async () => {
      prisma.provider.create.mockResolvedValue(mockProvider);
      const result = await service.create(
        {
          name: 'Salesforce',
          description: 'CRM cloud leader',
          contractType: 'SaaS',
          expiryDate: '2026-12-31',
        },
        'user-id',
      );
      expect(result).toEqual({
        ...mockProvider,
        _count: { applications: 0 },
        tags: [],
      });
      expect(prisma.provider.create).toHaveBeenCalledWith({
        data: {
          name: 'Salesforce',
          description: 'CRM cloud leader',
          comment: null,
          contractType: 'SaaS',
          expiryDate: new Date('2026-12-31'),
        },
      });
    });

    it('should trim name and description', async () => {
      prisma.provider.create.mockResolvedValue(mockProvider);
      await service.create(
        {
          name: '  Salesforce  ',
          description: '  CRM cloud leader  ',
        },
        'user-id',
      );
      expect(prisma.provider.create).toHaveBeenCalledWith({
        data: {
          name: 'Salesforce',
          description: 'CRM cloud leader',
          comment: null,
          contractType: null,
          expiryDate: null,
        },
      });
    });

    it('should throw ConflictException on duplicate name (P2002)', async () => {
      const error = { code: 'P2002', meta: { target: ['name'] } };
      prisma.provider.create.mockRejectedValue(error);
      await expect(
        service.create({ name: 'Salesforce', description: 'test' }, 'user-id'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update a provider', async () => {
      prisma.provider.update.mockResolvedValue({
        ...mockProvider,
        description: 'Updated description',
      });
      tagsService.getEntityTags.mockResolvedValue([]);
      const result = await service.update(
        mockProvider.id,
        { description: 'Updated description' },
        'user-id',
      );
      expect(result.description).toBe('Updated description');
    });

    it('should throw ConflictException on duplicate name', async () => {
      const error = { code: 'P2002', meta: { target: ['name'] } };
      prisma.provider.update.mockRejectedValue(error);
      await expect(
        service.update(mockProvider.id, { name: 'Existing' }, 'user-id'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when provider not found', async () => {
      const error = { code: 'P2025', meta: { modelName: 'Provider' } };
      prisma.provider.update.mockRejectedValue(error);
      await expect(
        service.update('nonexistent-id', { name: 'New' }, 'user-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should call prisma.provider.delete if no applications linked', async () => {
      prisma.provider.findUnique.mockResolvedValue({
        _count: { applications: 0 },
      });
      prisma.provider.delete.mockResolvedValue(mockProvider);
      await service.remove(mockProvider.id, 'user-id');
      expect(prisma.provider.delete).toHaveBeenCalledWith({
        where: { id: mockProvider.id },
      });
    });

    it('should throw NotFoundException when provider not found', async () => {
      prisma.provider.findUnique.mockResolvedValue(null);
      await expect(service.remove('nonexistent-id', 'user-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException with details when applications are linked', async () => {
      prisma.provider.findUnique.mockResolvedValue({
        _count: { applications: 3 },
      });
      
      try {
        await service.remove(mockProvider.id, 'user-id');
        fail('Expected ConflictException to be thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.response).toEqual({
          code: 'DEPENDENCY_CONFLICT',
          message: 'Provider is used by 3 application(s)',
          details: { applicationsCount: 3 },
        });
      }
    });
  });

  describe('getApplications', () => {
    it('should return paginated list of applications linked to provider', async () => {
      prisma.provider.findUnique.mockResolvedValue({ id: mockProvider.id });
      prisma.application.count.mockResolvedValue(2);
      prisma.application.findMany.mockResolvedValue([
        {
          id: 'app-1',
          name: 'CRM App',
          description: 'CRM application',
          domain: { id: 'dom-1', name: 'Sales' },
          owner: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
          criticality: 'high',
          lifecycleStatus: 'production',
          createdAt: new Date(),
        },
      ]);

      const result = await service.getApplications(mockProvider.id, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(2);
      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { providerId: mockProvider.id },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('should throw NotFoundException when provider not found', async () => {
      prisma.provider.findUnique.mockResolvedValue(null);
      await expect(service.getApplications('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
