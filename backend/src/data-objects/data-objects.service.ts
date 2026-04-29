import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TagsService } from '../tags/tags.service';
import { CreateDataObjectDto } from './dto/create-data-object.dto';
import { UpdateDataObjectDto } from './dto/update-data-object.dto';
import { QueryDataObjectsDto } from './dto/query-data-objects.dto';

@Injectable()
export class DataObjectsService {
  private readonly logger = new Logger(DataObjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tagsService: TagsService,
  ) {}

  async findAll(query: QueryDataObjectsDto) {
    this.logger.log({ method: 'findAll', query });

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { sortBy, sortOrder, search, type, isSourceOfTruth } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (type !== undefined) {
      where.type = { equals: type, mode: 'insensitive' };
    }

    if (isSourceOfTruth !== undefined) {
      where.isSourceOfTruth = isSourceOfTruth;
    }

    const total = await this.prisma.dataObject.count({ where });

    const dataObjects = await this.prisma.dataObject.findMany({
      where,
      skip,
      take: limit,
      orderBy: sortBy ? { [sortBy]: sortOrder } : { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        comment: true,
        type: true,
        isSourceOfTruth: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { appDataObjectMaps: true } },
      },
    });

    const ids = dataObjects.map((d) => d.id);
    const allTags = await this.tagsService.getEntitiesTags('data_object', ids);

    const data = dataObjects.map((dataObject) => ({
      ...dataObject,
      tags: allTags
        .filter((tag) => tag.entityId === dataObject.id)
        .map((tag) => tag.tagValue),
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    this.logger.log({ method: 'findOne', id });

    const dataObject = await this.prisma.dataObject.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        comment: true,
        type: true,
        isSourceOfTruth: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { appDataObjectMaps: true } },
      },
    });

    if (!dataObject) {
      throw new NotFoundException({
        code: 'DATA_OBJECT_NOT_FOUND',
        message: 'Data object not found',
      });
    }

    const tags = await this.tagsService.getEntityTags('data_object', id);

    return {
      ...dataObject,
      tags: tags.map((t) => t.tagValue),
    };
  }

  async create(createDto: CreateDataObjectDto, userId: string) {
    this.logger.log({ method: 'create', data: createDto });

    try {
      await this.prisma.setCurrentUser(userId);
      
      const dataObject = await this.prisma.dataObject.create({
        data: {
          name: createDto.name.trim(),
          ...(createDto.description && { description: createDto.description.trim() }),
          ...(createDto.comment && { comment: createDto.comment.trim() }),
          ...(createDto.type && { type: createDto.type.trim() }),
          isSourceOfTruth: createDto.isSourceOfTruth ?? false,
        },
        select: {
          id: true,
          name: true,
          description: true,
          comment: true,
          type: true,
          isSourceOfTruth: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { appDataObjectMaps: true } },
        },
      });

      this.logger.log({ method: 'create', result: dataObject.id });

      return {
        ...dataObject,
        tags: [],
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'Data object name already in use',
        });
      }
      throw error;
    }
  }

  async update(id: string, updateDto: UpdateDataObjectDto, userId: string) {
    this.logger.log({ method: 'update', id, data: updateDto });

    try {
      await this.prisma.setCurrentUser(userId);
      
      const dataObject = await this.prisma.dataObject.update({
        where: { id },
        data: {
          ...(updateDto.name !== undefined && { name: updateDto.name.trim() }),
          ...(updateDto.description !== undefined && {
            description: updateDto.description?.trim() || null,
          }),
          ...(updateDto.comment !== undefined && {
            comment: updateDto.comment?.trim() || null,
          }),
          ...(updateDto.type !== undefined && {
            type: updateDto.type?.trim() || null,
          }),
          ...(updateDto.isSourceOfTruth !== undefined && {
            isSourceOfTruth: updateDto.isSourceOfTruth,
          }),
        },
        select: {
          id: true,
          name: true,
          description: true,
          comment: true,
          type: true,
          isSourceOfTruth: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { appDataObjectMaps: true } },
        },
      });

      const tags = await this.tagsService.getEntityTags('data_object', id);

      this.logger.log({ method: 'update', result: dataObject.id });

      return {
        ...dataObject,
        tags: tags.map((t) => t.tagValue),
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException({
          code: 'DATA_OBJECT_NOT_FOUND',
          message: 'Data object not found',
        });
      }
      if (error.code === 'P2002') {
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'Data object name already in use',
        });
      }
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    this.logger.log({ method: 'remove', id });

    // Check if data object has linked applications
    const dataObject = await this.prisma.dataObject.findUnique({
      where: { id },
      select: {
        _count: { select: { appDataObjectMaps: true } },
      },
    });

    if (!dataObject) {
      throw new NotFoundException({
        code: 'DATA_OBJECT_NOT_FOUND',
        message: 'Data object not found',
      });
    }

    if (dataObject._count && dataObject._count.appDataObjectMaps > 0) {
      throw new ConflictException({
        code: 'DEPENDENCY_CONFLICT',
        message: 'Cannot delete data object with linked applications',
        details: {
          applicationsCount: dataObject._count.appDataObjectMaps,
        },
      });
    }

    try {
      await this.prisma.setCurrentUser(userId);
      await this.prisma.dataObject.delete({ where: { id } });

      this.logger.log({ method: 'remove', result: 'deleted' });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException({
          code: 'DATA_OBJECT_NOT_FOUND',
          message: 'Data object not found',
        });
      }
      throw error;
    }
  }

  async getApplications(
    id: string,
    query: QueryDataObjectsDto,
  ) {
    this.logger.log({ method: 'getApplications', id, query });

    // Verify data object exists
    const dataObject = await this.prisma.dataObject.findUnique({
      where: { id },
    });

    if (!dataObject) {
      throw new NotFoundException({
        code: 'DATA_OBJECT_NOT_FOUND',
        message: 'Data object not found',
      });
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const total = await this.prisma.appDataObjectMap.count({
      where: { dataObjectId: id },
    });

    const mappings = await this.prisma.appDataObjectMap.findMany({
      where: { dataObjectId: id },
      include: {
        application: {
          select: {
            id: true,
            name: true,
            description: true,
            criticality: true,
            lifecycleStatus: true,
            domain: { select: { id: true, name: true } },
            owner: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      skip,
      take: limit,
    });

    const data = mappings.map((m) => ({
      id: m.application.id,
      name: m.application.name,
      description: m.application.description,
      criticality: m.application.criticality,
      lifecycleStatus: m.application.lifecycleStatus,
      domain: m.application.domain,
      owner: m.application.owner,
      role: m.role,
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
