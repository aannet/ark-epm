import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../prisma/prisma.service';
import { TagsService } from '../tags/tags.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let prisma: jest.Mocked<PrismaService>;
  let tagsService: jest.Mocked<TagsService>;

  const mockUserId = 'user-123';

  const mockApplication = {
    id: 'app-123',
    name: 'Test Application',
    description: 'Test description',
    comment: 'Test comment',
    domainId: null,
    providerId: null,
    ownerId: null,
    criticality: 'high',
    lifecycleStatus: 'production',
    createdAt: new Date(),
    updatedAt: new Date(),
    domain: null,
    provider: null,
    owner: null,
  };

  const mockDomain = {
    id: 'domain-123',
    name: 'Test Domain',
  };

  const mockProvider = {
    id: 'provider-123',
    name: 'Test Provider',
  };

  const mockOwner = {
    id: 'owner-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      application: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      entityTag: {
        findMany: jest.fn(),
      },
      domain: {
        findUnique: jest.fn(),
      },
      provider: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      $executeRaw: jest.fn(),
    };

    const mockTagsService = {
      getEntityTags: jest.fn(),
      getEntitiesTags: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
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

    service = module.get<ApplicationsService>(ApplicationsService);
    prisma = module.get(PrismaService);
    tagsService = module.get(TagsService);
  });

  describe('findAll', () => {
    it('should return paginated applications with tags', async () => {
      const query = { page: 1, limit: 20, sortBy: 'name', sortOrder: 'asc' };
      const mockApps = [{ ...mockApplication, domain: mockDomain, provider: mockProvider, owner: mockOwner }];
      
      prisma.application.count.mockResolvedValue(1);
      prisma.application.findMany.mockResolvedValue(mockApps);
      tagsService.getEntitiesTags.mockResolvedValue([]);

      const result = await service.findAll(query as any);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(tagsService.getEntitiesTags).toHaveBeenCalledWith('application', ['app-123']);
    });

    it('should filter by lifecycle status', async () => {
      const query = { page: 1, limit: 20, lifecycleStatus: 'production' };
      prisma.application.count.mockResolvedValue(0);
      prisma.application.findMany.mockResolvedValue([]);

      const result = await service.findAll(query as any);

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { lifecycleStatus: 'production' },
        }),
      );
    });

    it('should filter by tag value ids', async () => {
      const query = { page: 1, limit: 20, tagValueIds: ['tag-1', 'tag-2'] };
      prisma.entityTag.findMany.mockResolvedValue([
        { entityId: 'app-123' },
        { entityId: 'app-456' },
      ]);
      prisma.application.count.mockResolvedValue(2);
      prisma.application.findMany.mockResolvedValue([
        { ...mockApplication, id: 'app-123' },
        { ...mockApplication, id: 'app-456', name: 'App 2' },
      ]);
      tagsService.getEntitiesTags.mockResolvedValue([]);

      const result = await service.findAll(query as any);

      expect(result.data).toHaveLength(2);
      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['app-123', 'app-456'] } },
        }),
      );
    });

    it('should return empty data when no tags match', async () => {
      const query = { page: 1, limit: 20, tagValueIds: ['nonexistent'] };
      prisma.entityTag.findMany.mockResolvedValue([]);

      const result = await service.findAll(query as any);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return an application with tags', async () => {
      prisma.application.findUnique.mockResolvedValue(mockApplication);
      tagsService.getEntityTags.mockResolvedValue([]);

      const result = await service.findOne('app-123');

      expect(result.id).toBe('app-123');
      expect(result.tags).toEqual([]);
    });

    it('should throw NotFoundException when application not found', async () => {
      prisma.application.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDependencies', () => {
    it('should return dependency counts', async () => {
      prisma.application.findUnique.mockResolvedValue({
        _count: {
          capabilities: 2,
          dataObjects: 3,
          itComponents: 1,
          sourceInterfaces: 4,
          targetInterfaces: 2,
        },
      });

      const result = await service.getDependencies('app-123');

      expect(result.hasDependencies).toBe(true);
      expect(result.counts).toEqual({
        capabilities: 2,
        dataObjects: 3,
        itComponents: 1,
        sourceInterfaces: 4,
        targetInterfaces: 2,
      });
    });

    it('should return hasDependencies false when no dependencies', async () => {
      prisma.application.findUnique.mockResolvedValue({
        _count: {
          capabilities: 0,
          dataObjects: 0,
          itComponents: 0,
          sourceInterfaces: 0,
          targetInterfaces: 0,
        },
      });

      const result = await service.getDependencies('app-123');

      expect(result.hasDependencies).toBe(false);
    });

    it('should throw NotFoundException when application not found', async () => {
      prisma.application.findUnique.mockResolvedValue(null);

      await expect(service.getDependencies('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create an application', async () => {
      const createDto = {
        name: 'New App',
        description: 'Description',
        comment: 'Comment',
        criticality: 'medium',
        lifecycleStatus: 'draft',
      };

      prisma.application.create.mockResolvedValue(mockApplication);

      const result = await service.create(createDto, mockUserId);

      expect(result.name).toBe('Test Application');
      expect(prisma.$executeRaw).toHaveBeenCalled();
    });

    it('should trim name and description', async () => {
      const createDto = {
        name: '  New App  ',
        description: '  Description  ',
      };

      prisma.application.create.mockResolvedValue(mockApplication);

      await service.create(createDto, mockUserId);

      expect(prisma.application.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New App',
            description: 'Description',
          }),
        }),
      );
    });

    it('should validate domain exists', async () => {
      const createDto = {
        name: 'New App',
        domainId: 'invalid-domain',
      };

      prisma.domain.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, mockUserId)).rejects.toThrow(NotFoundException);
    });

    it('should validate provider exists', async () => {
      const createDto = {
        name: 'New App',
        providerId: 'invalid-provider',
      };

      prisma.domain.findUnique.mockResolvedValue(null);
      prisma.provider.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, mockUserId)).rejects.toThrow(NotFoundException);
    });

    it('should validate owner exists', async () => {
      const createDto = {
        name: 'New App',
        ownerId: 'invalid-owner',
      };

      prisma.domain.findUnique.mockResolvedValue(null);
      prisma.provider.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, mockUserId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate name', async () => {
      const createDto = { name: 'Existing App' };
      const error = { code: 'P2002' };
      prisma.application.create.mockRejectedValue(error);

      await expect(service.create(createDto, mockUserId)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update an application', async () => {
      const updateDto = {
        name: 'Updated App',
        description: 'Updated description',
      };

      prisma.application.update.mockResolvedValue({
        ...mockApplication,
        name: 'Updated App',
        description: 'Updated description',
      });
      tagsService.getEntityTags.mockResolvedValue([]);

      const result = await service.update('app-123', updateDto, mockUserId);

      expect(result.name).toBe('Updated App');
    });

    it('should throw ConflictException on duplicate name', async () => {
      const updateDto = { name: 'Existing Name' };
      const error = { code: 'P2002' };
      prisma.application.update.mockRejectedValue(error);

      await expect(service.update('app-123', updateDto, mockUserId)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when application not found', async () => {
      const updateDto = { name: 'New Name' };
      const error = { code: 'P2025' };
      prisma.application.update.mockRejectedValue(error);

      await expect(service.update('nonexistent', updateDto, mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an application without dependencies', async () => {
      prisma.application.findUnique.mockResolvedValue({
        _count: {
          capabilities: 0,
          dataObjects: 0,
          itComponents: 0,
          sourceInterfaces: 0,
          targetInterfaces: 0,
        },
      });
      prisma.application.delete.mockResolvedValue(mockApplication);

      await service.remove('app-123', mockUserId);

      expect(prisma.application.delete).toHaveBeenCalledWith({ where: { id: 'app-123' } });
    });

    it('should throw ConflictException when application has linked capabilities', async () => {
      prisma.application.findUnique.mockResolvedValue({
        _count: {
          capabilities: 2,
          dataObjects: 0,
          itComponents: 0,
          sourceInterfaces: 0,
          targetInterfaces: 0,
        },
      });

      await expect(service.remove('app-123', mockUserId)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when application has linked data objects', async () => {
      prisma.application.findUnique.mockResolvedValue({
        _count: {
          capabilities: 0,
          dataObjects: 3,
          itComponents: 0,
          sourceInterfaces: 0,
          targetInterfaces: 0,
        },
      });

      await expect(service.remove('app-123', mockUserId)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when application has linked IT components', async () => {
      prisma.application.findUnique.mockResolvedValue({
        _count: {
          capabilities: 0,
          dataObjects: 0,
          itComponents: 1,
          sourceInterfaces: 0,
          targetInterfaces: 0,
        },
      });

      await expect(service.remove('app-123', mockUserId)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when application has linked interfaces', async () => {
      prisma.application.findUnique.mockResolvedValue({
        _count: {
          capabilities: 0,
          dataObjects: 0,
          itComponents: 0,
          sourceInterfaces: 2,
          targetInterfaces: 1,
        },
      });

      await expect(service.remove('app-123', mockUserId)).rejects.toThrow(ConflictException);
    });

    it('should include dependency details in ConflictException', async () => {
      prisma.application.findUnique.mockResolvedValue({
        _count: {
          capabilities: 2,
          dataObjects: 3,
          itComponents: 1,
          sourceInterfaces: 4,
          targetInterfaces: 2,
        },
      });

      try {
        await service.remove('app-123', mockUserId);
        fail('Should have thrown ConflictException');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.response.code).toBe('DEPENDENCY_CONFLICT');
        expect(error.response.details).toEqual({
          capabilities: 2,
          dataObjects: 3,
          itComponents: 1,
          sourceInterfaces: 4,
          targetInterfaces: 2,
        });
      }
    });
  });
});
