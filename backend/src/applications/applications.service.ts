import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TagsService } from '../tags/tags.service';
import { randomUUID } from 'crypto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { QueryApplicationsDto } from './dto/query-applications.dto';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tagsService: TagsService,
  ) {}

  async findAll(query: QueryApplicationsDto) {
    this.logger.log({ method: 'findAll', query });

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { sortBy, sortOrder, lifecycleStatus, tagValueIds } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (lifecycleStatus) {
      where.lifecycleStatus = lifecycleStatus;
    }

    let applicationIdsFromTags: string[] | undefined;
    if (tagValueIds && tagValueIds.length > 0) {
      const entityTags = await this.prisma.entityTag.findMany({
        where: {
          entityType: 'application',
          tagValueId: { in: tagValueIds },
        },
        select: { entityId: true },
      });
      applicationIdsFromTags = entityTags.map((et) => et.entityId);
      
      if (applicationIdsFromTags.length === 0) {
        return {
          data: [],
          meta: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        };
      }
      
      where.id = { in: applicationIdsFromTags };
    }

    let orderBy: any = {};
    if (sortBy === 'domain') {
      orderBy = {
        domain: { name: sortOrder },
      };
    } else if (sortBy) {
      orderBy = { [sortBy]: sortOrder };
    } else {
      orderBy = { name: 'asc' };
    }

    const total = await this.prisma.application.count({ where });

    const applications = await this.prisma.application.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        domain: { select: { id: true, name: true } },
        appProviderMaps: {
          include: {
            provider: { select: { id: true, name: true } },
          },
        },
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const appIds = applications.map((a) => a.id);
    const allTags = await this.tagsService.getEntitiesTags('application', appIds);

    const data = applications.map((app) => this.mapApplicationResponse(
      app,
      allTags.filter((tag) => tag.entityId === app.id).map((tag) => tag.tagValue),
    ));

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

    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        domain: { select: { id: true, name: true } },
        appProviderMaps: {
          include: {
            provider: { select: { id: true, name: true } },
          },
        },
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!application) {
      throw new NotFoundException({
        code: 'APPLICATION_NOT_FOUND',
        message: "L'application n'existe pas",
      });
    }

    const tags = await this.tagsService.getEntityTags('application', id);

    return this.mapApplicationResponse(
      application,
      tags.map((t) => t.tagValue),
    );
  }

  async getDependencies(id: string) {
    this.logger.log({ method: 'getDependencies', id });

    const app = await this.prisma.application.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            appProviderMaps: true,
            capabilities: true,
            dataObjects: true,
            itComponents: true,
            sourceInterfaces: true,
            targetInterfaces: true,
          },
        },
      },
    });

    if (!app) {
      throw new NotFoundException({
        code: 'APPLICATION_NOT_FOUND',
        message: "L'application n'existe pas",
      });
    }

    const counts = {
      providers: app._count.appProviderMaps,
      capabilities: app._count.capabilities,
      dataObjects: app._count.dataObjects,
      itComponents: app._count.itComponents,
      sourceInterfaces: app._count.sourceInterfaces,
      targetInterfaces: app._count.targetInterfaces,
    };

    const hasDependencies = Object.values(counts).some((count) => count > 0);

    return {
      hasDependencies,
      counts,
    };
  }

  async create(createDto: CreateApplicationDto, userId: string) {
    this.logger.log({ method: 'create', data: createDto, providersCount: createDto.providers?.length });

    await this.prisma.setCurrentUser(userId);
    await this.validateForeignKeys(createDto);

    try {
      const applicationId = randomUUID();

      const application = await this.prisma.application.create({
        data: {
          id: applicationId,
          name: createDto.name.trim(),
          description: createDto.description?.trim() || null,
          comment: createDto.comment?.trim() || null,
          domainId: createDto.domainId || null,
          ownerId: createDto.ownerId || null,
          criticality: createDto.criticality || null,
          lifecycleStatus: createDto.lifecycleStatus || null,
          updatedAt: new Date(),
          
          // Create provider mappings in same transaction
          ...(createDto.providers && createDto.providers.length > 0 && {
            appProviderMaps: {
              createMany: {
                data: createDto.providers.map(p => ({
                  providerId: p.id,
                  role: p.role,
                })),
              },
            },
          }),
        },
        include: {
          domain: { select: { id: true, name: true } },
          appProviderMaps: {
            include: {
              provider: { select: { id: true, name: true } },
            },
          },
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      this.logger.log({ method: 'create', result: application.id });

      return this.mapApplicationResponse(application, []);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'Application name already in use',
        });
      }
      throw error;
    }
  }

  async update(id: string, updateDto: UpdateApplicationDto, userId: string) {
    this.logger.log({ method: 'update', id, data: updateDto, providersCount: updateDto.providers?.length });

    await this.prisma.setCurrentUser(userId);
    await this.validateForeignKeys(updateDto);

    try {
      // Delete old provider mappings if providers are being updated
      if (updateDto.providers !== undefined) {
        await this.prisma.applicationProviderMap.deleteMany({
          where: { applicationId: id },
        });
      }

      const application = await this.prisma.application.update({
        where: { id },
        data: {
          ...(updateDto.name && { name: updateDto.name.trim() }),
          ...(updateDto.description !== undefined && { description: updateDto.description?.trim() || null }),
          ...(updateDto.comment !== undefined && { comment: updateDto.comment?.trim() || null }),
          ...(updateDto.domainId !== undefined && { domainId: updateDto.domainId || null }),
          ...(updateDto.ownerId !== undefined && { ownerId: updateDto.ownerId || null }),
          ...(updateDto.criticality !== undefined && { criticality: updateDto.criticality || null }),
          ...(updateDto.lifecycleStatus !== undefined && { lifecycleStatus: updateDto.lifecycleStatus || null }),
          updatedAt: new Date(),
          
          // Create new provider mappings if provided
          ...(updateDto.providers !== undefined && updateDto.providers.length > 0 && {
            appProviderMaps: {
              createMany: {
                data: updateDto.providers.map(p => ({
                  providerId: p.id,
                  role: p.role,
                })),
              },
            },
          }),
        },
        include: {
          domain: { select: { id: true, name: true } },
          appProviderMaps: {
            include: {
              provider: { select: { id: true, name: true } },
            },
          },
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      this.logger.log({ method: 'update', result: application.id });

      const tags = await this.tagsService.getEntityTags('application', id);

      return this.mapApplicationResponse(
        application,
        tags.map((t) => t.tagValue),
      );
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'Application name already in use',
        });
      }
      if (error.code === 'P2025') {
        throw new NotFoundException({
          code: 'APPLICATION_NOT_FOUND',
          message: "L'application n'existe pas",
        });
      }
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    this.logger.log({ method: 'remove', id });

    await this.prisma.setCurrentUser(userId);

    const dependencies = await this.getDependencies(id);

    if (dependencies.hasDependencies) {
      throw new ConflictException({
        code: 'DEPENDENCY_CONFLICT',
        message: 'Application has dependencies',
        details: dependencies.counts,
      });
    }

    await this.prisma.application.delete({ where: { id } });
    this.logger.log({ method: 'remove', result: id });
  }

  private async validateForeignKeys(dto: CreateApplicationDto | UpdateApplicationDto) {
    if (dto.domainId) {
      const domain = await this.prisma.domain.findUnique({
        where: { id: dto.domainId },
      });
      if (!domain) {
        throw new NotFoundException({
          code: 'DOMAIN_NOT_FOUND',
          message: 'Domain not found',
        });
      }
    }

    // Validate all providers exist (batch query)
    if (dto.providers && dto.providers.length > 0) {
      const providerIds = dto.providers.map(p => p.id);
      const validProviders = await this.prisma.provider.findMany({
        where: { id: { in: providerIds } },
      });
      if (validProviders.length !== providerIds.length) {
        throw new NotFoundException({
          code: 'PROVIDER_NOT_FOUND',
          message: 'One or more providers not found',
        });
      }
    }

    if (dto.ownerId) {
      const owner = await this.prisma.user.findUnique({
        where: { id: dto.ownerId },
      });
      if (!owner) {
        throw new NotFoundException({
          code: 'USER_NOT_FOUND',
          message: 'Owner not found',
        });
      }
    }
  }

  private mapApplicationResponse(
    application: any,
    tags: any[],
  ) {
    return {
      id: application.id,
      name: application.name,
      description: application.description,
      comment: application.comment,
      domain: application.domain ? {
        id: application.domain.id,
        name: application.domain.name,
      } : null,
      providers: (application.appProviderMaps || []).map((mapping: { provider: { id: string; name: string }; role: string | null }) => ({
        id: mapping.provider.id,
        name: mapping.provider.name,
        role: mapping.role,
      })),
      owner: application.owner ? {
        id: application.owner.id,
        firstName: application.owner.firstName,
        lastName: application.owner.lastName,
        email: application.owner.email,
      } : null,
      criticality: application.criticality,
      lifecycleStatus: application.lifecycleStatus,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      tags,
    };
  }
}
