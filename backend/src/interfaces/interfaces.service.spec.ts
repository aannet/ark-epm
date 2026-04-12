import { Test, TestingModule } from '@nestjs/testing';
import { InterfacesService } from './interfaces.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InterfaceType, InterfaceFrequency, CriticalityLevel, Prisma } from '@prisma/client';

// Mock crypto.randomUUID for consistent test IDs
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn(() => 'mock-uuid-12345'),
}));

describe('InterfacesService', () => {
  let service: InterfacesService;
  let prisma: PrismaService;

  const mockInterface = {
    id: 'mock-uuid-12345',
    name: 'Test Interface',
    description: 'Test description',
    comment: null,
    sourceAppId: 'app-source-id',
    targetAppId: 'app-target-id',
    middlewareAppId: null,
    type: InterfaceType.REST,
    frequency: InterfaceFrequency.DAILY,
    criticality: CriticalityLevel.HIGH,
    technicalContact: 'contact@example.com',
    errorRate: new Prisma.Decimal(0.5),
    createdAt: new Date(),
    updatedAt: new Date(),
    sourceApp: { id: 'app-source-id', name: 'Source App' },
    targetApp: { id: 'app-target-id', name: 'Target App' },
    middlewareApp: null,
  };

  const mockInterfaceWithMiddleware = {
    ...mockInterface,
    middlewareAppId: 'app-middleware-id',
    middlewareApp: { id: 'app-middleware-id', name: 'Middleware App' },
  };

  const mockPrismaService = {
    $executeRaw: jest.fn(),
    interface: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    application: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterfacesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<InterfacesService>(InterfacesService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of interfaces', async () => {
      mockPrismaService.interface.findMany.mockResolvedValue([mockInterface]);
      mockPrismaService.interface.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual([mockInterface]);
      expect(result.meta.total).toBe(1);
      expect(mockPrismaService.interface.findMany).toHaveBeenCalled();
    });

    it('should filter by sourceAppId', async () => {
      mockPrismaService.interface.findMany.mockResolvedValue([mockInterface]);
      mockPrismaService.interface.count.mockResolvedValue(1);

      await service.findAll({ sourceAppId: 'app-source-id' });

      expect(mockPrismaService.interface.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ sourceAppId: 'app-source-id' }),
        }),
      );
    });

    it('should filter by type', async () => {
      mockPrismaService.interface.findMany.mockResolvedValue([mockInterface]);
      mockPrismaService.interface.count.mockResolvedValue(1);

      await service.findAll({ type: InterfaceType.REST });

      expect(mockPrismaService.interface.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: InterfaceType.REST }),
        }),
      );
    });

    it('should filter by middlewareAppId', async () => {
      mockPrismaService.interface.findMany.mockResolvedValue([mockInterfaceWithMiddleware]);
      mockPrismaService.interface.count.mockResolvedValue(1);

      await service.findAll({ middlewareAppId: 'app-middleware-id' });

      expect(mockPrismaService.interface.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ middlewareAppId: 'app-middleware-id' }),
        }),
      );
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'New Interface',
      sourceAppId: 'app-source-id',
      targetAppId: 'app-target-id',
      type: InterfaceType.REST,
      frequency: InterfaceFrequency.DAILY,
      criticality: CriticalityLevel.HIGH,
    };

    it('should create and return the interface', async () => {
      mockPrismaService.application.findUnique.mockResolvedValueOnce({ id: 'app-source-id' });
      mockPrismaService.application.findUnique.mockResolvedValueOnce({ id: 'app-target-id' });
      mockPrismaService.interface.create.mockResolvedValue(mockInterface);

      const result = await service.create(createDto, 'user-id');

      expect(result).toEqual(mockInterface);
      expect(mockPrismaService.$executeRaw).toHaveBeenCalled();
      expect(mockPrismaService.interface.create).toHaveBeenCalled();
    });

    it('should create interface with middlewareAppId', async () => {
      const dtoWithMiddleware = { ...createDto, middlewareAppId: 'app-middleware-id' };
      mockPrismaService.application.findUnique.mockResolvedValueOnce({ id: 'app-source-id' });
      mockPrismaService.application.findUnique.mockResolvedValueOnce({ id: 'app-target-id' });
      mockPrismaService.application.findUnique.mockResolvedValueOnce({ id: 'app-middleware-id' });
      mockPrismaService.interface.create.mockResolvedValue(mockInterfaceWithMiddleware);

      const result = await service.create(dtoWithMiddleware, 'user-id');

      expect(result).toEqual(mockInterfaceWithMiddleware);
      expect(mockPrismaService.application.findUnique).toHaveBeenCalledTimes(3);
      expect(result.middlewareApp).toEqual({ id: 'app-middleware-id', name: 'Middleware App' });
    });

    it('should throw UnprocessableEntityException for self-reference', async () => {
      const invalidDto = { ...createDto, targetAppId: createDto.sourceAppId };

      await expect(service.create(invalidDto, 'user-id')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should throw NotFoundException for non-existent source app', async () => {
      mockPrismaService.application.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.application.findUnique.mockResolvedValueOnce({ id: 'app-target-id' });

      await expect(service.create(createDto, 'user-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for non-existent target app', async () => {
      mockPrismaService.application.findUnique.mockResolvedValueOnce({ id: 'app-source-id' });
      mockPrismaService.application.findUnique.mockResolvedValueOnce(null);

      await expect(service.create(createDto, 'user-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for non-existent middleware app', async () => {
      const dtoWithMiddleware = { ...createDto, middlewareAppId: 'invalid-middleware-id' };
      mockPrismaService.application.findUnique.mockResolvedValueOnce({ id: 'app-source-id' });
      mockPrismaService.application.findUnique.mockResolvedValueOnce({ id: 'app-target-id' });
      mockPrismaService.application.findUnique.mockResolvedValueOnce(null);

      await expect(service.create(dtoWithMiddleware, 'user-id')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.application.findUnique).toHaveBeenCalledTimes(3);
    });
  });

  describe('findOne', () => {
    it('should return an interface by id', async () => {
      mockPrismaService.interface.findUnique.mockResolvedValue(mockInterface);

      const result = await service.findOne('mock-uuid-12345');

      expect(result).toEqual(mockInterface);
      expect(mockPrismaService.interface.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'mock-uuid-12345' },
        }),
      );
    });

    it('should throw NotFoundException for non-existent interface', async () => {
      mockPrismaService.interface.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Interface Name',
    };

    it('should update and return the interface', async () => {
      mockPrismaService.interface.findUnique.mockResolvedValue(mockInterface);
      mockPrismaService.application.findUnique.mockResolvedValueOnce({ id: 'app-source-id' });
      mockPrismaService.application.findUnique.mockResolvedValueOnce({ id: 'app-target-id' });
      mockPrismaService.interface.update.mockResolvedValue({ ...mockInterface, ...updateDto });

      const result = await service.update('mock-uuid-12345', updateDto, 'user-id');

      expect(result.name).toBe('Updated Interface Name');
      expect(mockPrismaService.interface.update).toHaveBeenCalled();
    });

    it('should update with middlewareAppId', async () => {
      mockPrismaService.interface.findUnique.mockResolvedValue(mockInterface);
      mockPrismaService.application.findUnique.mockResolvedValueOnce({ id: 'app-source-id' });
      mockPrismaService.application.findUnique.mockResolvedValueOnce({ id: 'app-target-id' });
      mockPrismaService.application.findUnique.mockResolvedValueOnce({ id: 'app-middleware-id' });
      mockPrismaService.interface.update.mockResolvedValue(mockInterfaceWithMiddleware);

      const result = await service.update('mock-uuid-12345', { middlewareAppId: 'app-middleware-id' }, 'user-id');

      expect(result.middlewareAppId).toBe('app-middleware-id');
      expect(result.middlewareApp).toEqual({ id: 'app-middleware-id', name: 'Middleware App' });
    });

    it('should unset middlewareAppId when set to null', async () => {
      mockPrismaService.interface.findUnique.mockResolvedValue(mockInterfaceWithMiddleware);
      mockPrismaService.application.findUnique.mockResolvedValueOnce({ id: 'app-source-id' });
      mockPrismaService.application.findUnique.mockResolvedValueOnce({ id: 'app-target-id' });
      mockPrismaService.interface.update.mockResolvedValue(mockInterface);

      const result = await service.update('mock-uuid-12345', { middlewareAppId: null }, 'user-id');

      expect(result.middlewareAppId).toBeNull();
      expect(result.middlewareApp).toBeNull();
    });

    it('should throw UnprocessableEntityException for self-reference', async () => {
      mockPrismaService.interface.findUnique.mockResolvedValue(mockInterface);

      await expect(
        service.update('mock-uuid-12345', { sourceAppId: 'same-id', targetAppId: 'same-id' }, 'user-id'),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw NotFoundException for non-existent interface', async () => {
      mockPrismaService.interface.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent-id', updateDto, 'user-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete the interface', async () => {
      mockPrismaService.interface.findUnique.mockResolvedValue(mockInterface);
      mockPrismaService.interface.delete.mockResolvedValue(mockInterface);

      await service.remove('mock-uuid-12345');

      expect(mockPrismaService.interface.delete).toHaveBeenCalledWith({
        where: { id: 'mock-uuid-12345' },
      });
    });

    it('should throw NotFoundException for non-existent interface', async () => {
      mockPrismaService.interface.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should call prisma.interface.delete if interface exists', async () => {
      mockPrismaService.interface.findUnique.mockResolvedValue(mockInterface);

      await service.remove('mock-uuid-12345');

      expect(mockPrismaService.interface.delete).toHaveBeenCalledTimes(1);
    });
  });
});
