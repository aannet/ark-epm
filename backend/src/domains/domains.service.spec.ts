import { Test, TestingModule } from '@nestjs/testing';
import { DomainsService } from './domains.service';
import { PrismaService } from '../prisma/prisma.service';
import { TagsService } from '../tags/tags.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('DomainsService', () => {
  let service: DomainsService;
  let prisma: jest.Mocked<PrismaService>;
  let tagsService: jest.Mocked<TagsService>;

  const mockDomain = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Finance',
    description: 'Financial domain',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      domain: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const mockTagsService = {
      getEntityTags: jest.fn(),
      getEntitiesTags: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DomainsService,
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

    service = module.get<DomainsService>(DomainsService);
    prisma = module.get(PrismaService);
    tagsService = module.get(TagsService);
  });

  describe('findAll', () => {
    it('should return an array of domains with tags', async () => {
      prisma.domain.findMany.mockResolvedValue([mockDomain]);
      tagsService.getEntitiesTags.mockResolvedValue([]);
      
      const result = await service.findAll();
      
      expect(result).toEqual([{ ...mockDomain, tags: [] }]);
      expect(prisma.domain.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
      expect(tagsService.getEntitiesTags).toHaveBeenCalledWith('domain', [mockDomain.id]);
    });

    it('should return domains with their associated tags', async () => {
      const domain1 = { ...mockDomain, id: 'domain-1' };
      const domain2 = { ...mockDomain, id: 'domain-2', name: 'HR' };
      prisma.domain.findMany.mockResolvedValue([domain1, domain2]);
      
      const mockTags = [
        {
          entityType: 'domain',
          entityId: 'domain-1',
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
      
      const result = await service.findAll();
      
      expect(result).toHaveLength(2);
      expect(result[0].tags).toHaveLength(1);
      expect(result[0].tags[0].label).toBe('France');
      expect(result[1].tags).toHaveLength(0);
    });

    it('should return empty array when no domains exist', async () => {
      prisma.domain.findMany.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
      expect(tagsService.getEntitiesTags).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a domain by id', async () => {
      prisma.domain.findUnique.mockResolvedValue(mockDomain);
      const result = await service.findOne(mockDomain.id);
      expect(result).toEqual(mockDomain);
    });

    it('should throw NotFoundException when domain not found', async () => {
      prisma.domain.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a domain', async () => {
      prisma.domain.create.mockResolvedValue(mockDomain);
      const result = await service.create({
        name: 'Finance',
        description: 'Financial domain',
      });
      expect(result).toEqual(mockDomain);
      expect(prisma.domain.create).toHaveBeenCalledWith({
        data: {
          name: 'Finance',
          description: 'Financial domain',
        },
      });
    });

    it('should trim name and description', async () => {
      prisma.domain.create.mockResolvedValue(mockDomain);
      await service.create({
        name: '  Finance  ',
        description: '  Financial domain  ',
      });
      expect(prisma.domain.create).toHaveBeenCalledWith({
        data: {
          name: 'Finance',
          description: 'Financial domain',
        },
      });
    });

    it('should throw ConflictException on duplicate name', async () => {
      const error = { code: 'P2002', meta: { target: ['name'] } };
      prisma.domain.create.mockRejectedValue(error);
      await expect(
        service.create({ name: 'Finance', description: 'test' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update a domain', async () => {
      prisma.domain.update.mockResolvedValue({
        ...mockDomain,
        description: 'Updated description',
      });
      const result = await service.update(mockDomain.id, {
        description: 'Updated description',
      });
      expect(result.description).toBe('Updated description');
    });

    it('should throw ConflictException on duplicate name', async () => {
      const error = { code: 'P2002', meta: { target: ['name'] } };
      prisma.domain.update.mockRejectedValue(error);
      await expect(
        service.update(mockDomain.id, { name: 'Existing' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when domain not found', async () => {
      const error = { code: 'P2025', meta: { modelName: 'Domain' } };
      prisma.domain.update.mockRejectedValue(error);
      await expect(
        service.update('nonexistent-id', { name: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a domain with no linked entities', async () => {
      prisma.domain.findUnique.mockResolvedValue({
        _count: { applications: 0, businessCapabilities: 0 },
      });
      prisma.domain.delete.mockResolvedValue(mockDomain);
      await service.remove(mockDomain.id);
      expect(prisma.domain.delete).toHaveBeenCalledWith({
        where: { id: mockDomain.id },
      });
    });

    it('should throw ConflictException when applications are linked', async () => {
      prisma.domain.findUnique.mockResolvedValue({
        _count: { applications: 3, businessCapabilities: 0 },
      });
      await expect(service.remove(mockDomain.id)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when business capabilities are linked', async () => {
      prisma.domain.findUnique.mockResolvedValue({
        _count: { applications: 0, businessCapabilities: 4 },
      });
      await expect(service.remove(mockDomain.id)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when both are linked', async () => {
      prisma.domain.findUnique.mockResolvedValue({
        _count: { applications: 2, businessCapabilities: 4 },
      });
      await expect(service.remove(mockDomain.id)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException when domain not found', async () => {
      prisma.domain.findUnique.mockResolvedValue(null);
      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
