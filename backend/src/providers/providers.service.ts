import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TagsService } from '../tags/tags.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { QueryProvidersDto } from './dto/query-providers.dto';

@Injectable()
export class ProvidersService {
  private readonly logger = new Logger(ProvidersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tagsService: TagsService,
  ) {}

  async findAll(query: QueryProvidersDto) {
    this.logger.log({ method: 'findAll', query });

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { sortBy, sortOrder, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const total = await this.prisma.provider.count({ where });

    const providers = await this.prisma.provider.findMany({
      where,
      skip,
      take: limit,
      orderBy: sortBy ? { [sortBy]: sortOrder } : { name: 'asc' },
      include: {
        _count: { select: { applications: true } },
      },
    });

    // Batch load all tags for all providers at once
    const providerIds = providers.map((p) => p.id);
    const allTags = await this.tagsService.getEntitiesTags('provider', providerIds);

    const data = providers.map((provider) => ({
      ...provider,
      tags: allTags
        .filter((tag) => tag.entityId === provider.id)
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

    const provider = await this.prisma.provider.findUnique({
      where: { id },
      include: {
        _count: { select: { applications: true } },
      },
    });

    if (!provider) {
      throw new NotFoundException({
        code: 'PROVIDER_NOT_FOUND',
        message: "Le fournisseur n'existe pas",
      });
    }

    // Load tags via TagService
    const tags = await this.tagsService.getEntityTags('provider', id);

    return {
      ...provider,
      tags: tags.map((t) => t.tagValue),
    };
  }

  async create(createProviderDto: CreateProviderDto, userId: string) {
    this.logger.log({ method: 'create', data: createProviderDto });

    await this.prisma.setCurrentUser(userId);

    try {
      const provider = await this.prisma.provider.create({
        data: {
          name: createProviderDto.name.trim(),
          description: createProviderDto.description?.trim() || null,
          comment: createProviderDto.comment?.trim() || null,
          contractType: createProviderDto.contractType || null,
          expiryDate: createProviderDto.expiryDate
            ? new Date(createProviderDto.expiryDate)
            : null,
        },
      });
      this.logger.log({ method: 'create', result: provider.id });

      // Return provider with empty tags array and _count
      return {
        ...provider,
        _count: { applications: 0 },
        tags: [],
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'Provider name already in use',
        });
      }
      throw error;
    }
  }

  async update(id: string, updateProviderDto: UpdateProviderDto, userId: string) {
    this.logger.log({ method: 'update', id, data: updateProviderDto });

    await this.prisma.setCurrentUser(userId);

    try {
      const provider = await this.prisma.provider.update({
        where: { id },
        data: {
          name: updateProviderDto.name?.trim(),
          description: updateProviderDto.description?.trim() || null,
          comment: updateProviderDto.comment?.trim() || null,
          contractType: updateProviderDto.contractType ?? null,
          expiryDate: updateProviderDto.expiryDate
            ? new Date(updateProviderDto.expiryDate)
            : null,
        },
        include: {
          _count: { select: { applications: true } },
        },
      });
      this.logger.log({ method: 'update', result: provider.id });

      // Load tags for the response
      const tags = await this.tagsService.getEntityTags('provider', id);

      return {
        ...provider,
        tags: tags.map((t) => t.tagValue),
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'Provider name already in use',
        });
      }
      if (error.code === 'P2025') {
        throw new NotFoundException({
          code: 'PROVIDER_NOT_FOUND',
          message: "Le fournisseur n'existe pas",
        });
      }
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    this.logger.log({ method: 'remove', id });

    await this.prisma.setCurrentUser(userId);

    const provider = await this.prisma.provider.findUnique({
      where: { id },
      select: {
        _count: { select: { applications: true } },
      },
    });

    if (!provider) {
      throw new NotFoundException({
        code: 'PROVIDER_NOT_FOUND',
        message: "Le fournisseur n'existe pas",
      });
    }

    if (provider._count.applications > 0) {
      throw new ConflictException({
        code: 'DEPENDENCY_CONFLICT',
        message: `Provider is used by ${provider._count.applications} application(s)`,
        details: { applicationsCount: provider._count.applications },
      });
    }

    await this.prisma.provider.delete({ where: { id } });
    this.logger.log({ method: 'remove', result: id });
  }

  async getApplications(
    id: string,
    query: { page?: number; limit?: number } = {},
  ) {
    this.logger.log({ method: 'getApplications', id, query });

    // Verify provider exists
    const provider = await this.prisma.provider.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!provider) {
      throw new NotFoundException({
        code: 'PROVIDER_NOT_FOUND',
        message: "Le fournisseur n'existe pas",
      });
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = { providerId: id };

    const total = await this.prisma.application.count({ where });

    const applications = await this.prisma.application.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      include: {
        domain: { select: { id: true, name: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return {
      data: applications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
