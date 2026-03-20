import { Test, TestingModule } from '@nestjs/testing';
import { ItComponentsService } from './it-components.service';
import { PrismaService } from '../prisma/prisma.service';
import { TagsService } from '../tags/tags.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('ItComponentsService', () => {
  let service: ItComponentsService;
  let prisma: jest.Mocked<PrismaService>;
  let tagsService: jest.Mocked<TagsService>;

  const mockUserId = 'user-123';

  const mockItComponent = {
    id: 'itc-123',
    name: 'PostgreSQL Primary',
    description: 'Main database',
    comment: null,
    technology: 'PostgreSQL 16',
    type: 'database',
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { applications: 0 },
  };

  beforeEach(async () => {
    const txClient = {
      $executeRaw: jest.fn(),
      itComponent: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const mockPrismaService = {
      itComponent: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      appItComponentMap: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $executeRaw: jest.fn(),
      $transaction: jest.fn((cb: any) => cb(txClient)),
      setCurrentUser: jest.fn(),
    };

    const mockTagsService = {
      getEntityTags: jest.fn(),
      getEntitiesTags: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItComponentsService,
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

    service = module.get<ItComponentsService>(ItComponentsService);
    prisma = module.get(PrismaService);
    tagsService = module.get(TagsService);
  });

  describe('findAll', () => {
    it('should return a paginated object { data, meta }', async () => {
      const query = { page: 1, limit: 20, sortBy: 'name', sortOrder: 'asc' };

      prisma.itComponent.count.mockResolvedValue(1);
      prisma.itComponent.findMany.mockResolvedValue([mockItComponent]);
      tagsService.getEntitiesTags.mockResolvedValue([]);

      const result = await service.findAll(query as any);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
      expect(tagsService.getEntitiesTags).toHaveBeenCalledWith('it_component', ['itc-123']);
    });

    it('should filter by search term on name', async () => {
      const query = { page: 1, limit: 20, search: 'postgres' };

      prisma.itComponent.count.mockResolvedValue(0);
      prisma.itComponent.findMany.mockResolvedValue([]);
      tagsService.getEntitiesTags.mockResolvedValue([]);

      await service.findAll(query as any);

      expect(prisma.itComponent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { contains: 'postgres', mode: 'insensitive' } },
        }),
      );
    });

    it('should filter by type', async () => {
      const query = { page: 1, limit: 20, type: 'database' };

      prisma.itComponent.count.mockResolvedValue(0);
      prisma.itComponent.findMany.mockResolvedValue([]);
      tagsService.getEntitiesTags.mockResolvedValue([]);

      await service.findAll(query as any);

      expect(prisma.itComponent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: 'database' },
        }),
      );
    });

    it('should filter by technology', async () => {
      const query = { page: 1, limit: 20, technology: 'PostgreSQL 16' };

      prisma.itComponent.count.mockResolvedValue(0);
      prisma.itComponent.findMany.mockResolvedValue([]);
      tagsService.getEntitiesTags.mockResolvedValue([]);

      await service.findAll(query as any);

      expect(prisma.itComponent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { technology: 'PostgreSQL 16' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return the IT Component with tags and _count.applications', async () => {
      prisma.itComponent.findUnique.mockResolvedValue(mockItComponent);
      tagsService.getEntityTags.mockResolvedValue([]);

      const result = await service.findOne('itc-123');

      expect(result.id).toBe('itc-123');
      expect(result._count.applications).toBe(0);
      expect(result.tags).toEqual([]);
      expect(tagsService.getEntityTags).toHaveBeenCalledWith('it_component', 'itc-123');
    });

    it('should throw NotFoundException if UUID does not exist', async () => {
      prisma.itComponent.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should return the created IT Component', async () => {
      prisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          $executeRaw: jest.fn(),
          itComponent: { create: jest.fn().mockResolvedValue(mockItComponent) },
        };
        return cb(tx);
      });

      const createDto = {
        name: 'PostgreSQL Primary',
        description: 'Main database',
        technology: 'PostgreSQL 16',
        type: 'database',
      };

      const result = await service.create(createDto, mockUserId);

      expect(result.name).toBe('PostgreSQL Primary');
      expect(result.tags).toEqual([]);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw ConflictException on Prisma P2002 error', async () => {
      prisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          $executeRaw: jest.fn(),
          itComponent: { create: jest.fn().mockRejectedValue({ code: 'P2002' }) },
        };
        return cb(tx);
      });

      const createDto = { name: 'Duplicate' };
      await expect(service.create(createDto as any, mockUserId)).rejects.toThrow(ConflictException);
    });
  });

  describe('getApplications', () => {
    it('should return paginated list of linked applications', async () => {
      prisma.itComponent.findUnique.mockResolvedValue({ id: 'itc-123' });

      const mockApp = {
        id: 'app-1',
        name: 'App 1',
        description: null,
        criticality: null,
        lifecycleStatus: null,
        createdAt: new Date(),
        domain: null,
        owner: null,
      };

      prisma.appItComponentMap.count.mockResolvedValue(1);
      prisma.appItComponentMap.findMany.mockResolvedValue([
        { applicationId: 'app-1', itComponentId: 'itc-123', application: mockApp },
      ]);

      const result = await service.getApplications('itc-123', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('app-1');
      expect(result.meta.total).toBe(1);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if UUID does not exist', async () => {
      prisma.itComponent.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent', mockUserId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if applications are linked', async () => {
      prisma.itComponent.findUnique.mockResolvedValue({
        _count: { applications: 3 },
      });

      try {
        await service.remove('itc-123', mockUserId);
        fail('Should have thrown ConflictException');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.response.code).toBe('DEPENDENCY_CONFLICT');
        expect(error.response.details).toEqual({ applicationsCount: 3 });
      }
    });

    it('should call prisma.itComponent.delete() when no applications are linked', async () => {
      prisma.itComponent.findUnique.mockResolvedValue({
        _count: { applications: 0 },
      });

      const mockDelete = jest.fn();
      prisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          $executeRaw: jest.fn(),
          itComponent: { delete: mockDelete },
        };
        return cb(tx);
      });

      await service.remove('itc-123', mockUserId);

      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'itc-123' } });
    });
  });
});
