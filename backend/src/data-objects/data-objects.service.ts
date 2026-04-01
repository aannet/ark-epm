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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    const { sortBy, sortOrder, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const total = await this.prisma.dataObject.count({ where });

    const dataObjects = await this.prisma.dataObject.findMany({
      where,
      skip,
      take: limit,
      orderBy: sortBy ? { [sortBy]: sortOrder } : { name: 'asc' },
      include: {
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
      include: {
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

  private async setAuditUser(tx: any, userId: string): Promise<void> {
    if (!userId || !UUID_REGEX.test(userId)) return;
    await tx.$executeRaw`SET LOCAL "ark.current_user_id" = ${userId}`;
  }

  async create(createDto: CreateDataObjectDto, userId: string) {
    this.logger.log({ method: 'create', data: createDto });

    try {
      const dataObject = await this.prisma.$transaction(async (tx) => {
        await this.setAuditUser(tx, userId);
        return tx.dataObject.create({
          data: {
            name: createDto.name.trim(),
            description: createDto.description?.trim() || null,
            comment: createDto.comment?.trim() || null,
            type: createDto.type?.trim() || null,
            isSourceOfTruth: createDto.isSourceOfTruth ?? false,
          },
          include: {
            _count: { select: { appDataObjectMaps: true } },
          },
        });
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
      const dataObject = await this.prisma.$transaction(async (tx) => {
        await this.setAuditUser(tx, userId);
        return tx.dataObject.update({
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
          include: {
            _count: { select: { appDataObjectMaps: true } },
          },
        });
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
      include: {
        _count: { select: { appDataObjectMaps: true } },
      },
    });

    if (!dataObject) {
      throw new NotFoundException({
        code: 'DATA_OBJECT_NOT_FOUND',
        message: 'Data object not found',
      });
    }

    if (dataObject._count.appDataObjectMaps > 0) {
      throw new ConflictException({
        code: 'DEPENDENCY_CONFLICT',
        message: 'Cannot delete data object with linked applications',
        details: {
          applicationsCount: dataObject._count.appDataObjectMaps,
        },
      });
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await this.setAuditUser(tx, userId);
        await tx.dataObject.delete({ where: { id } });
      });

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
