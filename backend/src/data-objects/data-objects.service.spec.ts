import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { DataObjectsService } from './data-objects.service';
import { PrismaService } from '../prisma/prisma.service';
import { TagsService } from '../tags/tags.service';
import { CreateDataObjectDto } from './dto/create-data-object.dto';
import { UpdateDataObjectDto } from './dto/update-data-object.dto';

describe('DataObjectsService', () => {
  let service: DataObjectsService;
  let prismaService: PrismaService;
  let tagsService: TagsService;

  const mockDataObject = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Customer Database',
    description: 'Main customer database',
    comment: 'Production',
    type: 'database',
    isSourceOfTruth: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { appDataObjectMaps: 0 },
  };

  const mockPrismaService = {
    dataObject: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    appDataObjectMap: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
    $executeRaw: jest.fn(),
  };

  const mockTagsService = {
    getEntitiesTags: jest.fn(),
    getEntityTags: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataObjectsService,
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

    service = module.get<DataObjectsService>(DataObjectsService);
    prismaService = module.get<PrismaService>(PrismaService);
    tagsService = module.get<TagsService>(TagsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // TEST 1: findAll returns paginated object with data and meta
  describe('findAll', () => {
    it('should return paginated result with data and meta', async () => {
      const mockDataObjects = [mockDataObject];
      
      mockPrismaService.dataObject.count.mockResolvedValueOnce(1);
      mockPrismaService.dataObject.findMany.mockResolvedValueOnce(mockDataObjects);
      mockTagsService.getEntitiesTags.mockResolvedValueOnce([]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.total).toBe(1);
    });

    // TEST 2: findAll with search filter applies insensitive search
    it('should apply search filter with insensitive search', async () => {
      mockPrismaService.dataObject.count.mockResolvedValueOnce(1);
      mockPrismaService.dataObject.findMany.mockResolvedValueOnce([mockDataObject]);
      mockTagsService.getEntitiesTags.mockResolvedValueOnce([]);

      await service.findAll({ page: 1, limit: 20, search: 'customer' });

      const findManyCall = mockPrismaService.dataObject.findMany.mock.calls[0][0];
      expect(findManyCall.where.name.contains).toBe('customer');
      expect(findManyCall.where.name.mode).toBe('insensitive');
    });
  });

  // TEST 3: create returns data object with empty tags
  describe('create', () => {
    it('should create data object and return with empty tags', async () => {
      const createDto: CreateDataObjectDto = {
        name: 'Test DataObject',
        description: 'Test',
      };
      const userId = '550e8400-e29b-41d4-a716-446655440001';

      mockPrismaService.$transaction.mockResolvedValueOnce(mockDataObject);

      const result = await service.create(createDto, userId);

      expect(result.tags).toEqual([]);
      expect(result.id).toBe(mockDataObject.id);
    });

    // TEST 4: create throws ConflictException on P2002 (name duplicate)
    it('should throw ConflictException on P2002 duplicate name', async () => {
      const createDto: CreateDataObjectDto = {
        name: 'Duplicate',
      };
      const userId = '550e8400-e29b-41d4-a716-446655440001';

      mockPrismaService.$transaction.mockRejectedValueOnce({
        code: 'P2002',
      });

      await expect(service.create(createDto, userId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // TEST 5: findOne returns data object with tags and _count.applications
  describe('findOne', () => {
    it('should return data object with tags and applications count', async () => {
      mockPrismaService.dataObject.findUnique.mockResolvedValueOnce(
        mockDataObject,
      );
      mockTagsService.getEntityTags.mockResolvedValueOnce([]);

      const result = await service.findOne(mockDataObject.id);

      expect(result._count.appDataObjectMaps).toBe(0);
      expect(result.tags).toEqual([]);
    });

    // TEST 6: findOne throws NotFoundException if UUID doesn't exist
    it('should throw NotFoundException for non-existent UUID', async () => {
      mockPrismaService.dataObject.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.findOne('550e8400-e29b-41d4-a716-446655440099'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // TEST 7: getApplications returns paginated list of linked applications
  describe('getApplications', () => {
    it('should return paginated list of linked applications', async () => {
      mockPrismaService.dataObject.findUnique.mockResolvedValueOnce(
        mockDataObject,
      );
      const mockApplications = [
        {
          applicationId: '550e8400-e29b-41d4-a716-446655440010',
          dataObjectId: mockDataObject.id,
          role: 'consumer',
          application: {
            id: '550e8400-e29b-41d4-a716-446655440010',
            name: 'App 1',
            description: null,
          },
        },
      ];
      mockPrismaService.appDataObjectMap.count.mockResolvedValueOnce(1);
      mockPrismaService.appDataObjectMap.findMany.mockResolvedValueOnce(
        mockApplications,
      );

      const result = await service.getApplications(mockDataObject.id, {
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  // TEST 8: remove throws NotFoundException if UUID doesn't exist
  describe('remove', () => {
    it('should throw NotFoundException for non-existent UUID', async () => {
      mockPrismaService.dataObject.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.remove('550e8400-e29b-41d4-a716-446655440099', 'userId'),
      ).rejects.toThrow(NotFoundException);
    });

    // TEST 9: remove throws ConflictException if applications are linked
    it('should throw ConflictException if applications are linked', async () => {
      const dataObjectWithApps = {
        ...mockDataObject,
        _count: { appDataObjectMaps: 2 },
      };
      mockPrismaService.dataObject.findUnique.mockResolvedValueOnce(
        dataObjectWithApps,
      );

      await expect(
        service.remove(mockDataObject.id, 'userId'),
      ).rejects.toThrow(ConflictException);
    });

    // TEST 10: remove calls prisma.dataObject.delete if no applications linked
    it('should delete if no applications linked', async () => {
      mockPrismaService.dataObject.findUnique.mockResolvedValueOnce(
        mockDataObject,
      );
      mockPrismaService.$transaction.mockResolvedValueOnce(undefined);

      await service.remove(mockDataObject.id, 'userId');

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });
});
