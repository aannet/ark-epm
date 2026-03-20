import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TagsService } from '../tags/tags.service';
import { randomUUID } from 'crypto';
import { CreateItComponentDto } from './dto/create-it-component.dto';
import { UpdateItComponentDto } from './dto/update-it-component.dto';
import { QueryItComponentsDto } from './dto/query-it-components.dto';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class ItComponentsService {
  private readonly logger = new Logger(ItComponentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tagsService: TagsService,
  ) {}

  async findAll(query: QueryItComponentsDto) {
    this.logger.log({ method: 'findAll', query });

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { sortBy, sortOrder, search, type, technology } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (type) {
      where.type = type;
    }

    if (technology) {
      where.technology = technology;
    }

    const total = await this.prisma.itComponent.count({ where });

    const itComponents = await this.prisma.itComponent.findMany({
      where,
      skip,
      take: limit,
      orderBy: sortBy ? { [sortBy]: sortOrder } : { name: 'asc' },
      include: {
        _count: { select: { applications: true } },
      },
    });

    const ids = itComponents.map((c) => c.id);
    const allTags = await this.tagsService.getEntitiesTags('it_component', ids);

    const data = itComponents.map((component) => ({
      ...component,
      tags: allTags
        .filter((tag) => tag.entityId === component.id)
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

    const itComponent = await this.prisma.itComponent.findUnique({
      where: { id },
      include: {
        _count: { select: { applications: true } },
      },
    });

    if (!itComponent) {
      throw new NotFoundException({
        code: 'IT_COMPONENT_NOT_FOUND',
        message: 'IT Component not found',
      });
    }

    const tags = await this.tagsService.getEntityTags('it_component', id);

    return {
      ...itComponent,
      tags: tags.map((t) => t.tagValue),
    };
  }

  private async setAuditUser(tx: any, userId: string): Promise<void> {
    if (!userId || !UUID_REGEX.test(userId)) return;
    await tx.$executeRawUnsafe(
      `SET LOCAL "ark.current_user_id" = '${userId}'`,
    );
  }

  async create(createDto: CreateItComponentDto, userId: string) {
    this.logger.log({ method: 'create', data: createDto });

    try {
      const itComponent = await this.prisma.$transaction(async (tx) => {
        await this.setAuditUser(tx, userId);
        return tx.itComponent.create({
          data: {
            id: randomUUID(),
            name: createDto.name.trim(),
            description: createDto.description?.trim() || null,
            comment: createDto.comment?.trim() || null,
            technology: createDto.technology?.trim() || null,
            type: createDto.type?.trim() || null,
            updatedAt: new Date(),
          },
          include: {
            _count: { select: { applications: true } },
          },
        });
      });

      this.logger.log({ method: 'create', result: itComponent.id });

      return {
        ...itComponent,
        tags: [],
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'IT Component name already in use',
        });
      }
      throw error;
    }
  }

  async update(id: string, updateDto: UpdateItComponentDto, userId: string) {
    this.logger.log({ method: 'update', id, data: updateDto });

    try {
      const itComponent = await this.prisma.$transaction(async (tx) => {
        await this.setAuditUser(tx, userId);
        return tx.itComponent.update({
          where: { id },
          data: {
            name: updateDto.name?.trim(),
            description: updateDto.description?.trim() || null,
            comment: updateDto.comment?.trim() || null,
            technology: updateDto.technology?.trim() || null,
            type: updateDto.type?.trim() || null,
            updatedAt: new Date(),
          },
          include: {
            _count: { select: { applications: true } },
          },
        });
      });

      this.logger.log({ method: 'update', result: itComponent.id });

      const tags = await this.tagsService.getEntityTags('it_component', id);

      return {
        ...itComponent,
        tags: tags.map((t) => t.tagValue),
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'IT Component name already in use',
        });
      }
      if (error.code === 'P2025') {
        throw new NotFoundException({
          code: 'IT_COMPONENT_NOT_FOUND',
          message: 'IT Component not found',
        });
      }
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    this.logger.log({ method: 'remove', id });

    const itComponent = await this.prisma.itComponent.findUnique({
      where: { id },
      select: {
        _count: { select: { applications: true } },
      },
    });

    if (!itComponent) {
      throw new NotFoundException({
        code: 'IT_COMPONENT_NOT_FOUND',
        message: 'IT Component not found',
      });
    }

    if (itComponent._count.applications > 0) {
      throw new ConflictException({
        code: 'DEPENDENCY_CONFLICT',
        message: `IT Component is used by ${itComponent._count.applications} application(s)`,
        details: { applicationsCount: itComponent._count.applications },
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await this.setAuditUser(tx, userId);
      await tx.itComponent.delete({ where: { id } });
    });
    this.logger.log({ method: 'remove', result: id });
  }

  async getApplications(
    id: string,
    query: { page?: number; limit?: number } = {},
  ) {
    this.logger.log({ method: 'getApplications', id, query });

    const itComponent = await this.prisma.itComponent.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!itComponent) {
      throw new NotFoundException({
        code: 'IT_COMPONENT_NOT_FOUND',
        message: 'IT Component not found',
      });
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = { itComponentId: id };

    const total = await this.prisma.appItComponentMap.count({ where });

    const mappings = await this.prisma.appItComponentMap.findMany({
      where,
      skip,
      take: limit,
      include: {
        application: {
          include: {
            domain: { select: { id: true, name: true } },
            owner: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { application: { name: 'asc' } },
    });

    const data = mappings.map((m) => m.application);

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
