import { Test, TestingModule } from '@nestjs/testing';
import { BusinessCapabilitiesService } from './business-capabilities.service';
import { PrismaService } from '../prisma/prisma.service';
import { TagsService } from '../tags/tags.service';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

describe('BusinessCapabilitiesService', () => {
  let service: BusinessCapabilitiesService;
  let prisma: jest.Mocked<PrismaService>;
  let tagsService: jest.Mocked<TagsService>;

  const mockCapability = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Financial Planning',
    description: 'Financial capability',
    comment: null,
    parentId: null,
    level: 0,
    domainId: null,
    domain: null,
    parent: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { children: 0, applicationMappings: 0 },
  };

  const mockChild = {
    ...mockCapability,
    id: 'child-uuid-0000-0000-0000-000000000001',
    name: 'Budget Management',
    parentId: mockCapability.id,
    level: 1,
  };

  const userId = 'user-uuid-0000-0000-0000-000000000001';

  beforeEach(async () => {
    const mockPrismaService = {
      setCurrentUser: jest.fn(),
      businessCapability: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      appCapabilityMap: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      domain: {
        findUnique: jest.fn(),
      },
      $queryRaw: jest.fn(),
      $executeRaw: jest.fn(),
    };

    const mockTagsService = {
      getEntityTags: jest.fn().mockResolvedValue([]),
      getEntitiesTags: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessCapabilitiesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TagsService, useValue: mockTagsService },
      ],
    }).compile();

    service = module.get<BusinessCapabilitiesService>(BusinessCapabilitiesService);
    prisma = module.get(PrismaService);
    tagsService = module.get(TagsService);
  });

  // ─── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return a paginated object { data, meta }', async () => {
      prisma.businessCapability.findMany.mockResolvedValue([mockCapability]);
      prisma.businessCapability.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta.total).toBe(1);
    });

    it('should apply search filter on name', async () => {
      prisma.businessCapability.findMany.mockResolvedValue([]);
      prisma.businessCapability.count.mockResolvedValue(0);

      await service.findAll({ search: 'finance' });

      expect(prisma.businessCapability.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'finance', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should apply domainId filter', async () => {
      const domainId = 'domain-uuid-1234-5678-9012-345678901234';
      prisma.businessCapability.findMany.mockResolvedValue([]);
      prisma.businessCapability.count.mockResolvedValue(0);

      await service.findAll({ domainId });

      expect(prisma.businessCapability.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ domainId }),
        }),
      );
    });
  });

  // ─── findTree ───────────────────────────────────────────────────────────────

  describe('findTree', () => {
    it('should return a nested tree structure with roots', async () => {
      const parent = { ...mockCapability, parentId: null };
      const child = { ...mockChild, parentId: mockCapability.id };
      prisma.businessCapability.findMany.mockResolvedValue([parent, child]);

      const result = await service.findTree();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(mockCapability.id);
      expect(result.data[0].children).toHaveLength(1);
      expect(result.data[0].children[0].id).toBe(mockChild.id);
    });
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a root capability with level = 0', async () => {
      prisma.businessCapability.create.mockResolvedValue({ ...mockCapability, level: 0 });

      const result = await service.create({ name: 'New Capability' }, userId);

      expect(result.level).toBe(0);
      expect(prisma.setCurrentUser).toHaveBeenCalledWith(userId);
    });

    it('should create a child capability with level = parent.level + 1', async () => {
      const parentCapability = { ...mockCapability, level: 1 };
      prisma.businessCapability.findUnique.mockResolvedValueOnce(parentCapability); // validateParentExists
      prisma.businessCapability.findUnique.mockResolvedValueOnce(parentCapability); // calculateLevel
      prisma.businessCapability.create.mockResolvedValue({ ...mockChild, level: 2 });

      const result = await service.create(
        { name: 'Child Capability', parentId: mockCapability.id },
        userId,
      );

      expect(result.level).toBe(2);
    });

    it('should throw ConflictException on Prisma P2002', async () => {
      prisma.businessCapability.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.create({ name: 'Duplicate' }, userId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── findOne ────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return the capability with tags and _count', async () => {
      prisma.businessCapability.findUnique.mockResolvedValue(mockCapability);
      tagsService.getEntityTags.mockResolvedValue([]);

      const result = await service.findOne(mockCapability.id);

      expect(result.id).toBe(mockCapability.id);
      expect(result).toHaveProperty('tags');
      expect(result).toHaveProperty('_count');
    });

    it('should throw NotFoundException if UUID does not exist', async () => {
      prisma.businessCapability.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getChildren ────────────────────────────────────────────────────────────

  describe('getChildren', () => {
    it('should return paginated children list', async () => {
      prisma.businessCapability.findUnique.mockResolvedValue(mockCapability);
      prisma.businessCapability.findMany.mockResolvedValue([mockChild]);
      prisma.businessCapability.count.mockResolvedValue(1);

      const result = await service.getChildren(mockCapability.id);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  // ─── getApplications ────────────────────────────────────────────────────────

  describe('getApplications', () => {
    it('should return paginated applications list', async () => {
      const mockApp = { id: 'app-id', name: 'App 1' };
      prisma.businessCapability.findUnique.mockResolvedValue(mockCapability);
      prisma.appCapabilityMap.findMany.mockResolvedValue([
        { application: mockApp, capabilityId: mockCapability.id, applicationId: mockApp.id },
      ]);
      prisma.appCapabilityMap.count.mockResolvedValue(1);

      const result = await service.getApplications(mockCapability.id);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should recalculate level and cascade on reparenting', async () => {
      const newParent = { ...mockCapability, id: 'new-parent-id', level: 2 };
      prisma.businessCapability.findUnique
        .mockResolvedValueOnce(mockCapability) // existing check
        .mockResolvedValueOnce(newParent)       // validateParentExists
        .mockResolvedValueOnce(newParent);      // calculateLevel
      prisma.$queryRaw.mockResolvedValue([{ exists: false }]);
      prisma.businessCapability.update.mockResolvedValue({ ...mockCapability, level: 3 });
      prisma.businessCapability.findUnique.mockResolvedValue({ level: 3 }); // recalculate
      prisma.$executeRaw.mockResolvedValue(0);
      tagsService.getEntityTags.mockResolvedValue([]);

      const result = await service.update(
        mockCapability.id,
        { parentId: newParent.id },
        userId,
      );

      expect(result.level).toBe(3);
      expect(prisma.$executeRaw).toHaveBeenCalled();
    });

    it('should throw BadRequestException on circular reference', async () => {
      prisma.businessCapability.findUnique
        .mockResolvedValueOnce(mockCapability)
        .mockResolvedValueOnce(mockChild); // validateParentExists
      prisma.$queryRaw.mockResolvedValue([{ exists: true }]); // circular detected

      await expect(
        service.update(mockCapability.id, { parentId: mockChild.id }, userId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should throw NotFoundException if UUID does not exist', async () => {
      prisma.businessCapability.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent', userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if capability has children', async () => {
      prisma.businessCapability.findUnique.mockResolvedValue({
        _count: { children: 2, applicationMappings: 0 },
      });

      await expect(service.remove(mockCapability.id, userId)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if capability has linked applications', async () => {
      prisma.businessCapability.findUnique.mockResolvedValue({
        _count: { children: 0, applicationMappings: 3 },
      });

      await expect(service.remove(mockCapability.id, userId)).rejects.toThrow(ConflictException);
    });

    it('should call prisma.delete if no dependencies', async () => {
      prisma.businessCapability.findUnique.mockResolvedValue({
        _count: { children: 0, applicationMappings: 0 },
      });
      prisma.businessCapability.delete.mockResolvedValue(mockCapability);

      await service.remove(mockCapability.id, userId);

      expect(prisma.businessCapability.delete).toHaveBeenCalledWith({
        where: { id: mockCapability.id },
      });
    });
  });

  // ─── calculateLevel ─────────────────────────────────────────────────────────

  describe('calculateLevel', () => {
    it('should return 0 for root (no parent)', async () => {
      const level = await service.calculateLevel(null);
      expect(level).toBe(0);
    });

    it('should return parent.level + 1 for child', async () => {
      prisma.businessCapability.findUnique.mockResolvedValue({ level: 2 });
      const level = await service.calculateLevel('parent-id');
      expect(level).toBe(3);
    });
  });
});
