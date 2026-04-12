import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TagsService } from '../tags/tags.service';
import { CreateBusinessCapabilityDto } from './dto/create-business-capability.dto';
import { UpdateBusinessCapabilityDto } from './dto/update-business-capability.dto';
import { QueryBusinessCapabilitiesDto } from './dto/query-business-capabilities.dto';

export interface BusinessCapabilityTreeNode {
  id: string;
  name: string;
  level: number | null;
  parentId: string | null;
  domainId: string | null;
  criticality: string | null;
  technicalFit: string | null;
  domain: { id: string; name: string } | null;
  _count: { applicationMappings: number; children: number };
  children: BusinessCapabilityTreeNode[];
}

@Injectable()
export class BusinessCapabilitiesService {
  private readonly logger = new Logger(BusinessCapabilitiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tagsService: TagsService,
  ) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  async calculateLevel(parentId: string | null | undefined): Promise<number> {
    if (!parentId) return 0;
    const parent = await this.prisma.businessCapability.findUnique({
      where: { id: parentId },
      select: { level: true },
    });
    if (!parent) {
      throw new NotFoundException({
        code: 'BUSINESS_CAPABILITY_NOT_FOUND',
        message: 'Parent business capability not found',
      });
    }
    return (parent.level ?? 0) + 1;
  }

  async isDescendant(ancestorId: string, descendantId: string): Promise<boolean> {
    if (ancestorId === descendantId) return true;
    const result = await this.prisma.$queryRaw<{ exists: boolean }[]>`
      WITH RECURSIVE descendants AS (
        SELECT id, parent_id FROM business_capabilities WHERE id = ${descendantId}::uuid
        UNION ALL
        SELECT c.id, c.parent_id FROM business_capabilities c
        INNER JOIN descendants d ON c.parent_id = d.id
      )
      SELECT EXISTS(SELECT 1 FROM descendants WHERE id = ${ancestorId}::uuid) as exists
    `;
    return result[0]?.exists ?? false;
  }

  async recalculateLevelsRecursively(rootId: string): Promise<void> {
    const root = await this.prisma.businessCapability.findUnique({
      where: { id: rootId },
      select: { level: true },
    });
    if (!root) return;
    await this.prisma.$executeRaw`
      WITH RECURSIVE descendants AS (
        SELECT id, parent_id, ${root.level} + 1 as new_level
        FROM business_capabilities WHERE parent_id = ${rootId}::uuid
        UNION ALL
        SELECT c.id, c.parent_id, d.new_level + 1
        FROM business_capabilities c
        INNER JOIN descendants d ON c.parent_id = d.id
      )
      UPDATE business_capabilities bc
      SET level = d.new_level
      FROM descendants d
      WHERE bc.id = d.id
    `;
  }

  private async validateDomainExists(domainId: string): Promise<void> {
    const domain = await this.prisma.domain.findUnique({ where: { id: domainId } });
    if (!domain) {
      throw new NotFoundException({
        code: 'DOMAIN_NOT_FOUND',
        message: 'Domain not found',
      });
    }
  }

  private async validateParentExists(parentId: string): Promise<void> {
    const parent = await this.prisma.businessCapability.findUnique({
      where: { id: parentId },
    });
    if (!parent) {
      throw new NotFoundException({
        code: 'BUSINESS_CAPABILITY_NOT_FOUND',
        message: 'Parent business capability not found',
      });
    }
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  async findAll(query: QueryBusinessCapabilitiesDto) {
    const { page = 1, limit = 20, search, sortBy = 'name', sortOrder = 'asc', domainId } = query;

    const where: Record<string, unknown> = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (domainId) {
      where.domainId = domainId;
    }

    const [data, total] = await Promise.all([
      this.prisma.businessCapability.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          domain: { select: { id: true, name: true } },
          _count: { select: { children: true, applicationMappings: true } },
        },
      }),
      this.prisma.businessCapability.count({ where }),
    ]);

    this.logger.log({ method: 'findAll', total, page, limit });
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findTree(): Promise<{ data: BusinessCapabilityTreeNode[] }> {
    const allCapabilities = await this.prisma.businessCapability.findMany({
      select: {
        id: true,
        name: true,
        level: true,
        parentId: true,
        domainId: true,
        criticality: true,
        technicalFit: true,
        domain: { select: { id: true, name: true } },
        _count: { select: { children: true, applicationMappings: true } },
      },
      orderBy: { name: 'asc' },
    });

    const map = new Map<string, BusinessCapabilityTreeNode>(
      allCapabilities.map((c) => [c.id, { ...c, children: [] }]),
    );
    const roots: BusinessCapabilityTreeNode[] = [];

    for (const cap of allCapabilities) {
      const node = map.get(cap.id)!;
      if (cap.parentId) {
        const parent = map.get(cap.parentId);
        if (parent) parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    this.logger.log({ method: 'findTree', roots: roots.length });
    return { data: roots };
  }

  async findOne(id: string) {
    const capability = await this.prisma.businessCapability.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true } },
        domain: { select: { id: true, name: true } },
        _count: { select: { children: true, applicationMappings: true } },
      },
    });

    if (!capability) {
      throw new NotFoundException({
        code: 'BUSINESS_CAPABILITY_NOT_FOUND',
        message: 'Business capability not found',
      });
    }

    const tags = await this.tagsService.getEntityTags('business-capability', id);
    this.logger.log({ method: 'findOne', id });
    return { ...capability, tags };
  }

  async getChildren(id: string, page = 1, limit = 20) {
    const capability = await this.prisma.businessCapability.findUnique({ where: { id } });
    if (!capability) {
      throw new NotFoundException({
        code: 'BUSINESS_CAPABILITY_NOT_FOUND',
        message: 'Business capability not found',
      });
    }

    const where = { parentId: id };
    const [data, total] = await Promise.all([
      this.prisma.businessCapability.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          domain: { select: { id: true, name: true } },
          _count: { select: { children: true, applicationMappings: true } },
        },
      }),
      this.prisma.businessCapability.count({ where }),
    ]);

    this.logger.log({ method: 'getChildren', id, total });
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getApplications(id: string, page = 1, limit = 20) {
    const capability = await this.prisma.businessCapability.findUnique({ where: { id } });
    if (!capability) {
      throw new NotFoundException({
        code: 'BUSINESS_CAPABILITY_NOT_FOUND',
        message: 'Business capability not found',
      });
    }

    const mappings = await this.prisma.appCapabilityMap.findMany({
      where: { capabilityId: id },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        application: {
          include: {
            domain: { select: { id: true, name: true } },
            owner: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    const total = await this.prisma.appCapabilityMap.count({ where: { capabilityId: id } });

    this.logger.log({ method: 'getApplications', id, total });
    return {
      data: mappings.map((m) => m.application),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(dto: CreateBusinessCapabilityDto, userId: string) {
    if (dto.domainId) await this.validateDomainExists(dto.domainId);
    if (dto.parentId) await this.validateParentExists(dto.parentId);

    const level = await this.calculateLevel(dto.parentId);

    await this.prisma.setCurrentUser(userId);

    try {
      const capability = await this.prisma.businessCapability.create({
        data: {
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          comment: dto.comment?.trim() || null,
          parentId: dto.parentId ?? null,
          domainId: dto.domainId ?? null,
          criticality: dto.criticality ?? null,
          technicalFit: dto.technicalFit ?? null,
          level,
          updatedAt: new Date(),
        },
        include: {
          parent: { select: { id: true, name: true } },
          domain: { select: { id: true, name: true } },
          _count: { select: { children: true, applicationMappings: true } },
        },
      });

      this.logger.log({ method: 'create', result: capability.id, level });
      return { ...capability, tags: [] };
    } catch (error) {
      if (error?.code === 'P2002') {
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'Business capability name already in use',
        });
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateBusinessCapabilityDto, userId: string) {
    const existing = await this.prisma.businessCapability.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        code: 'BUSINESS_CAPABILITY_NOT_FOUND',
        message: 'Business capability not found',
      });
    }

    if (dto.domainId !== undefined && dto.domainId !== null) {
      await this.validateDomainExists(dto.domainId);
    }

    // Reparenting logic (RM-08)
    const isReparenting = 'parentId' in dto;
    if (isReparenting && dto.parentId !== undefined && dto.parentId !== null) {
      await this.validateParentExists(dto.parentId);
      if (await this.isDescendant(dto.parentId, id)) {
        throw new BadRequestException({
          code: 'CIRCULAR_REFERENCE',
          message: 'Cannot set parent to self or descendant (circular reference)',
        });
      }
    }

    const newParentId = isReparenting ? dto.parentId : existing.parentId;
    const levelChanged = isReparenting && newParentId !== existing.parentId;
    const newLevel = levelChanged ? await this.calculateLevel(newParentId) : existing.level;

    await this.prisma.setCurrentUser(userId);

    try {
      const capability = await this.prisma.businessCapability.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
          ...(dto.comment !== undefined && { comment: dto.comment?.trim() || null }),
          ...(isReparenting && { parentId: newParentId ?? null }),
          ...(dto.domainId !== undefined && { domainId: dto.domainId ?? null }),
          ...(dto.criticality !== undefined && { criticality: dto.criticality ?? null }),
          ...(dto.technicalFit !== undefined && { technicalFit: dto.technicalFit ?? null }),
          level: newLevel,
          updatedAt: new Date(),
        },
        include: {
          parent: { select: { id: true, name: true } },
          domain: { select: { id: true, name: true } },
          _count: { select: { children: true, applicationMappings: true } },
        },
      });

      // Cascade level recalculation to all descendants (RM-07)
      if (levelChanged) {
        await this.recalculateLevelsRecursively(id);
      }

      const tags = await this.tagsService.getEntityTags('business-capability', id);
      this.logger.log({ method: 'update', id, level: newLevel });
      return { ...capability, tags };
    } catch (error) {
      if (error?.code === 'P2002') {
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'Business capability name already in use',
        });
      }
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    const capability = await this.prisma.businessCapability.findUnique({
      where: { id },
      select: {
        _count: { select: { children: true, applicationMappings: true } },
      },
    });

    if (!capability) {
      throw new NotFoundException({
        code: 'BUSINESS_CAPABILITY_NOT_FOUND',
        message: 'Business capability not found',
      });
    }

    const { children, applicationMappings } = capability._count;
    if (children > 0 || applicationMappings > 0) {
      throw new ConflictException({
        code: 'DEPENDENCY_CONFLICT',
        message: `Business capability is used by ${applicationMappings} application(s) and has ${children} children`,
        details: {
          applicationsCount: applicationMappings,
          childrenCount: children,
        },
      } as unknown as string);
    }

    await this.prisma.setCurrentUser(userId);
    await this.prisma.businessCapability.delete({ where: { id } });
    this.logger.log({ method: 'remove', id });
  }
}
