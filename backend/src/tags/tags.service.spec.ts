import { Test, TestingModule } from '@nestjs/testing';
import { TagsService } from './tags.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

describe('TagsService', () => {
  let service: TagsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    tagDimension: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    tagValue: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    entityTag: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $executeRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('normalizePath', () => {
    it('should normalize "Europe / France / Paris" to "europe/france/paris"', () => {
      const result = service.normalizePath('Europe / France / Paris');
      expect(result).toBe('europe/france/paris');
    });

    it('should normalize "  Europe  " to "europe"', () => {
      const result = service.normalizePath('  Europe  ');
      expect(result).toBe('europe');
    });

    it('should normalize "Paris" to "paris"', () => {
      const result = service.normalizePath('Paris');
      expect(result).toBe('paris');
    });

    it('should throw on invalid characters like "<" and ">"', () => {
      expect(() => service.normalizePath('France<Paris>')).toThrow(BadRequestException);
    });

    it('should throw on empty path', () => {
      expect(() => service.normalizePath('')).toThrow(BadRequestException);
    });

    it('should throw on path with only slashes', () => {
      expect(() => service.normalizePath('////')).toThrow(BadRequestException);
    });

    it('should replace spaces with dashes', () => {
      const result = service.normalizePath('europe west france');
      expect(result).toBe('europe-west-france');
    });
  });

  describe('getAncestorPaths', () => {
    it('should return ["a", "a/b"] for "a/b/c"', () => {
      const result = service.getAncestorPaths('a/b/c');
      expect(result).toEqual(['a', 'a/b']);
    });

    it('should return ["a"] for "a/b"', () => {
      const result = service.getAncestorPaths('a/b');
      expect(result).toEqual(['a']);
    });

    it('should return [] for "a" (root)', () => {
      const result = service.getAncestorPaths('a');
      expect(result).toEqual([]);
    });

    it('should return [] for single segment', () => {
      const result = service.getAncestorPaths('europe');
      expect(result).toEqual([]);
    });
  });

  describe('labelFromPath', () => {
    it('should convert "paris" to "Paris"', () => {
      const result = service.labelFromPath('paris');
      expect(result).toBe('Paris');
    });

    it('should convert "north-america" to "North America"', () => {
      const result = service.labelFromPath('north-america');
      expect(result).toBe('North America');
    });

    it('should convert "france" to "France"', () => {
      const result = service.labelFromPath('france');
      expect(result).toBe('France');
    });

    it('should handle single word', () => {
      const result = service.labelFromPath('europe');
      expect(result).toBe('Europe');
    });
  });

  describe('findAllDimensions', () => {
    it('should return all dimensions ordered by sortOrder', async () => {
      const mockDimensions = [
        { id: '1', name: 'Geography', sortOrder: 0 },
        { id: '2', name: 'Brand', sortOrder: 1 },
      ];
      mockPrismaService.tagDimension.findMany.mockResolvedValue(mockDimensions);

      const result = await service.findAllDimensions();

      expect(mockPrismaService.tagDimension.findMany).toHaveBeenCalledWith({
        orderBy: { sortOrder: 'asc' },
      });
      expect(result).toEqual(mockDimensions);
    });
  });

  describe('createDimension', () => {
    it('should create a dimension successfully', async () => {
      const dto = { name: 'New Dimension', description: 'Test', color: '#FF0000', icon: 'test' };
      const userId = 'user-1';
      const mockDimension = { id: '1', ...dto, multiValue: true, entityScope: [], sortOrder: 0, createdAt: new Date() };

      mockPrismaService.tagDimension.findUnique.mockResolvedValue(null);
      mockPrismaService.tagDimension.create.mockResolvedValue(mockDimension);
      mockPrismaService.$executeRaw.mockResolvedValue(undefined);

      const result = await service.createDimension(dto as any, userId);

      expect(result).toEqual(mockDimension);
      expect(mockPrismaService.tagDimension.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if dimension name already exists', async () => {
      const dto = { name: 'Existing Dimension' };
      const userId = 'user-1';
      mockPrismaService.tagDimension.findUnique.mockResolvedValue({ id: '1', name: 'Existing Dimension' });
      mockPrismaService.$executeRaw.mockResolvedValue(undefined);

      await expect(service.createDimension(dto as any, userId)).rejects.toThrow(ConflictException);
    });
  });

  describe('autocomplete', () => {
    it('should return tag values with dimensionColor and dimensionName', async () => {
      const mockDimension = { id: 'dim-1', name: 'Geography', color: '#2196F3' };
      const mockValues = [
        { 
          id: 'val-1', 
          dimensionId: 'dim-1', 
          path: 'europe/france/paris', 
          label: 'Paris', 
          depth: 2, 
          parentId: 'parent-1',
          dimension: { name: 'Geography', color: '#2196F3' }
        },
      ];

      mockPrismaService.tagDimension.findFirst.mockResolvedValue(mockDimension);
      mockPrismaService.tagValue.findMany.mockResolvedValue(mockValues);

      const result = await service.autocomplete('Geography', 'paris', 20);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('dimensionColor', '#2196F3');
      expect(result[0]).toHaveProperty('dimensionName', 'Geography');
      expect(result[0]).toHaveProperty('depth', 2);
    });

    it('should throw NotFoundException if dimension not found', async () => {
      mockPrismaService.tagDimension.findFirst.mockResolvedValue(null);

      await expect(service.autocomplete('NonExistent', 'test')).rejects.toThrow(NotFoundException);
    });
  });

  describe('resolveTag', () => {
    it('should return existing tag with dimensionName and dimensionColor', async () => {
      const mockDimension = { id: 'dim-1', name: 'Geography', color: '#2196F3' };
      const mockExistingTag = { 
        id: 'val-1', 
        dimensionId: 'dim-1', 
        path: 'europe/france/paris', 
        label: 'Paris', 
        depth: 2, 
        parentId: null,
        createdAt: new Date()
      };

      mockPrismaService.tagDimension.findUnique.mockResolvedValue(mockDimension);
      mockPrismaService.tagValue.findUnique.mockResolvedValue(mockExistingTag);
      mockPrismaService.$executeRaw.mockResolvedValue(undefined);

      const result = await service.resolveTag({ dimensionId: 'dim-1', path: 'europe/france/paris' }, 'user-1');

      expect(result).toHaveProperty('dimensionName', 'Geography');
      expect(result).toHaveProperty('dimensionColor', '#2196F3');
      expect(result.id).toBe('val-1');
    });

    it('should create new tag with ancestors and include dimensionName/dimensionColor', async () => {
      const mockDimension = { id: 'dim-1', name: 'Geography', color: '#2196F3' };

      mockPrismaService.tagDimension.findUnique.mockResolvedValue(mockDimension);
      mockPrismaService.tagValue.create.mockResolvedValue({ id: 'new-val' });
      mockPrismaService.$executeRaw.mockResolvedValue(undefined);

      // Mock the final findUnique call with include
      const mockCreatedTag = {
        id: 'new-val',
        dimensionId: 'dim-1',
        path: 'europe/france/paris',
        label: 'Paris',
        depth: 2,
        parentId: 'parent-1',
        createdAt: new Date(),
        dimension: { name: 'Geography', color: '#2196F3' }
      };
      
      // The resolveTag method makes multiple findUnique calls:
      // 1. Check if tag exists (should return null)
      // 2. Check each ancestor segment in the loop (3 segments = 3 calls, all return null)
      // 3. Final call with include to get the created tag
      mockPrismaService.tagValue.findUnique
        .mockResolvedValueOnce(null) // Initial check
        .mockResolvedValueOnce(null) // europe
        .mockResolvedValueOnce(null) // europe/france
        .mockResolvedValueOnce(null) // europe/france/paris (in loop)
        .mockResolvedValueOnce(mockCreatedTag); // Final call with include

      const result = await service.resolveTag({ dimensionId: 'dim-1', path: 'europe/france/paris', label: 'Paris' }, 'user-1');

      expect(mockPrismaService.tagValue.create).toHaveBeenCalledTimes(3); // 3 segments created
      expect(result).toHaveProperty('dimensionName', 'Geography');
      expect(result).toHaveProperty('dimensionColor', '#2196F3');
    });

    it('should throw BadRequestException for empty path', async () => {
      mockPrismaService.$executeRaw.mockResolvedValue(undefined);
      
      await expect(service.resolveTag({ dimensionId: 'dim-1', path: '' }, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for path with only slashes', async () => {
      mockPrismaService.$executeRaw.mockResolvedValue(undefined);
      
      await expect(service.resolveTag({ dimensionId: 'dim-1', path: '///' }, 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getEntityTags', () => {
    it('should return entity tags with dimensionName and dimensionColor', async () => {
      const mockEntityTags = [
        {
          entityType: 'domain',
          entityId: 'domain-1',
          taggedAt: new Date(),
          tagValue: {
            id: 'val-1',
            dimensionId: 'dim-1',
            path: 'europe/france/paris',
            label: 'Paris',
            depth: 2,
            parentId: null,
            dimension: { name: 'Geography', color: '#2196F3' }
          }
        }
      ];

      mockPrismaService.entityTag.findMany.mockResolvedValue(mockEntityTags);

      const result = await service.getEntityTags('domain', 'domain-1');

      expect(result).toHaveLength(1);
      expect(result[0].tagValue).toHaveProperty('dimensionName', 'Geography');
      expect(result[0].tagValue).toHaveProperty('dimensionColor', '#2196F3');
      expect(result[0].tagValue).toHaveProperty('depth', 2);
    });

    it('should return empty array if no tags found', async () => {
      mockPrismaService.entityTag.findMany.mockResolvedValue([]);

      const result = await service.getEntityTags('domain', 'domain-1');

      expect(result).toEqual([]);
    });
  });

  describe('putEntityTags', () => {
    it('should update tags and return them with dimensionName and dimensionColor', async () => {
      const mockDimension = { id: 'dim-1', name: 'Geography', color: '#2196F3' };
      const mockTagValues = [{ id: 'val-1', dimensionId: 'dim-1' }];
      const mockEntityTags = [
        {
          entityType: 'domain',
          entityId: 'domain-1',
          taggedAt: new Date(),
          tagValue: {
            id: 'val-1',
            dimensionId: 'dim-1',
            path: 'europe/france/paris',
            label: 'Paris',
            depth: 2,
            parentId: null,
            dimension: { name: 'Geography', color: '#2196F3' }
          }
        }
      ];

      mockPrismaService.tagDimension.findUnique.mockResolvedValue(mockDimension);
      mockPrismaService.tagValue.findMany.mockResolvedValue(mockTagValues);
      mockPrismaService.entityTag.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.entityTag.createMany.mockResolvedValue({ count: 1 });
      mockPrismaService.entityTag.findMany.mockResolvedValue(mockEntityTags);
      mockPrismaService.$executeRaw.mockResolvedValue(undefined);

      const result = await service.putEntityTags('domain', 'domain-1', { dimensionId: 'dim-1', tagValueIds: ['val-1'] }, 'user-1');

      expect(result).toHaveLength(1);
      expect(result[0].tagValue).toHaveProperty('dimensionName', 'Geography');
      expect(result[0].tagValue).toHaveProperty('dimensionColor', '#2196F3');
      expect(mockPrismaService.entityTag.deleteMany).toHaveBeenCalled();
      expect(mockPrismaService.entityTag.createMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException if dimension not found', async () => {
      mockPrismaService.tagDimension.findUnique.mockResolvedValue(null);
      mockPrismaService.$executeRaw.mockResolvedValue(undefined);

      await expect(service.putEntityTags('domain', 'domain-1', { dimensionId: 'dim-1', tagValueIds: [] }, 'user-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if tag value belongs to different dimension', async () => {
      const mockDimension = { id: 'dim-1', name: 'Geography' };
      const mockTagValues = [{ id: 'val-1', dimensionId: 'dim-2' }]; // Wrong dimension

      mockPrismaService.tagDimension.findUnique.mockResolvedValue(mockDimension);
      mockPrismaService.tagValue.findMany.mockResolvedValue(mockTagValues);
      mockPrismaService.$executeRaw.mockResolvedValue(undefined);

      await expect(service.putEntityTags('domain', 'domain-1', { dimensionId: 'dim-1', tagValueIds: ['val-1'] }, 'user-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should delete all tags for dimension if tagValueIds is empty', async () => {
      const mockDimension = { id: 'dim-1', name: 'Geography' };

      mockPrismaService.tagDimension.findUnique.mockResolvedValue(mockDimension);
      mockPrismaService.tagValue.findMany.mockResolvedValue([]);
      mockPrismaService.entityTag.deleteMany.mockResolvedValue({ count: 2 });
      mockPrismaService.entityTag.findMany.mockResolvedValue([]);
      mockPrismaService.$executeRaw.mockResolvedValue(undefined);

      const result = await service.putEntityTags('domain', 'domain-1', { dimensionId: 'dim-1', tagValueIds: [] }, 'user-1');

      expect(mockPrismaService.entityTag.deleteMany).toHaveBeenCalled();
      expect(mockPrismaService.entityTag.createMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
