import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDimensionDto } from './dto/create-tag-dimension.dto';
import { UpdateTagDimensionDto } from './dto/update-tag-dimension.dto';
import { ResolveTagDto } from './dto/resolve-tag.dto';
import { PutEntityTagsDto } from './dto/put-entity-tags.dto';

const INVALID_PATH_CHARS = /[\\"'\x00-\x1F<>]/;
const MAX_PATH_LENGTH = 500;

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAllDimensions(): Promise<
    Array<{
      id: string;
      name: string;
      description: string | null;
      color: string | null;
      icon: string | null;
      multiValue: boolean;
      entityScope: string[];
      sortOrder: number;
      createdAt: Date;
    }>
  > {
    return this.prisma.tagDimension.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createDimension(
    dto: CreateTagDimensionDto,
    userId: string,
  ): Promise<{
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    multiValue: boolean;
    entityScope: string[];
    sortOrder: number;
    createdAt: Date;
  }> {
    await this.setCurrentUser(userId);

    const existing = await this.prisma.tagDimension.findUnique({
      where: { name: dto.name.trim() },
    });

    if (existing) {
      throw new ConflictException({
        code: 'DIMENSION_ALREADY_EXISTS',
        message: `Dimension "${dto.name}" already exists`,
      });
    }

    const dimension = await this.prisma.tagDimension.create({
      data: {
        name: dto.name.trim(),
        description: dto.description,
        color: dto.color,
        icon: dto.icon,
        multiValue: dto.multiValue ?? true,
        entityScope: dto.entityScope ?? [],
      },
    });

    this.logger.log({
      method: 'createDimension',
      userId,
      dimensionId: dimension.id,
      result: 'created',
    });

    return dimension;
  }

  async updateDimension(
    id: string,
    dto: UpdateTagDimensionDto,
    userId: string,
  ): Promise<{
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    multiValue: boolean;
    entityScope: string[];
    sortOrder: number;
    createdAt: Date;
  }> {
    await this.setCurrentUser(userId);

    const existing = await this.prisma.tagDimension.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'DIMENSION_NOT_FOUND',
        message: 'Dimension not found',
      });
    }

    const dimension = await this.prisma.tagDimension.update({
      where: { id },
      data: {
        description: dto.description ?? existing.description,
        color: dto.color ?? existing.color,
        icon: dto.icon ?? existing.icon,
      },
    });

    this.logger.log({
      method: 'updateDimension',
      userId,
      dimensionId: id,
      result: 'updated',
    });

    return dimension;
  }

  async autocomplete(
    dimensionIdOrName: string,
    query?: string,
    limit = 20,
  ): Promise<
    Array<{
      id: string;
      dimensionId: string;
      dimensionName: string;
      path: string;
      label: string;
      depth: number;
      parentId: string | null;
    }>
  > {
    let dimensionId = dimensionIdOrName;

    const dimension = await this.prisma.tagDimension.findFirst({
      where: {
        OR: [{ id: dimensionIdOrName }, { name: dimensionIdOrName }],
      },
    });

    if (!dimension) {
      throw new NotFoundException({
        code: 'DIMENSION_NOT_FOUND',
        message: 'Dimension not found',
      });
    }

    dimensionId = dimension.id;

    const whereClause: Record<string, unknown> = { dimensionId };

    if (query && query.length >= 1) {
      const normalizedQuery = this.normalizePath(query);
      whereClause.OR = [
        { path: { contains: normalizedQuery } },
        { label: { contains: query, mode: 'insensitive' } },
      ];
    }

    const values = await this.prisma.tagValue.findMany({
      where: whereClause,
      orderBy: { path: 'asc' },
      take: limit,
      include: { dimension: { select: { name: true } } },
    });

    return values.map((v) => ({
      id: v.id,
      dimensionId: v.dimensionId,
      dimensionName: v.dimension.name,
      path: v.path,
      label: v.label,
      depth: v.depth,
      parentId: v.parentId,
    }));
  }

  async resolveTag(
    dto: ResolveTagDto,
    userId: string,
  ): Promise<{
    id: string;
    dimensionId: string;
    path: string;
    label: string;
    depth: number;
    parentId: string | null;
    createdAt: Date;
  }> {
    await this.setCurrentUser(userId);

    const normalizedPath = this.normalizePath(dto.path);

    if (normalizedPath === '' || /^\/+$/.test(normalizedPath)) {
      throw new BadRequestException({
        code: 'INVALID_TAG_PATH',
        message: 'Path cannot be empty or consist only of slashes',
      });
    }

    const dimension = await this.prisma.tagDimension.findUnique({
      where: { id: dto.dimensionId },
    });

    if (!dimension) {
      throw new NotFoundException({
        code: 'DIMENSION_NOT_FOUND',
        message: 'Dimension not found',
      });
    }

    const existing = await this.prisma.tagValue.findUnique({
      where: {
        dimensionId_path: {
          dimensionId: dto.dimensionId,
          path: normalizedPath,
        },
      },
    });

    if (existing) {
      return existing;
    }

    const ancestorPaths = this.getAncestorPaths(normalizedPath);
    const segments = normalizedPath.split('/');
    const label = dto.label || this.labelFromPath(segments[segments.length - 1]);

    let parentId: string | null = null;

    for (let i = 0; i < segments.length; i++) {
      const segmentPath = segments.slice(0, i + 1).join('/');
      const isLeaf = i === segments.length - 1;
      const segmentLabel = isLeaf
        ? label
        : this.labelFromPath(segments[i]);

      const existingSegment = await this.prisma.tagValue.findUnique({
        where: {
          dimensionId_path: {
            dimensionId: dto.dimensionId,
            path: segmentPath,
          },
        },
      });

      if (existingSegment) {
        parentId = existingSegment.id;
        continue;
      }

      const created: { id: string } = await this.prisma.tagValue.create({
        data: {
          dimensionId: dto.dimensionId,
          path: segmentPath,
          label: segmentLabel,
          parentId,
          depth: i,
        },
      });

      parentId = created.id;

      this.logger.log({
        method: 'resolveTag',
        userId,
        dimensionId: dto.dimensionId,
        tagValueId: created.id,
        path: segmentPath,
        result: 'created',
      });
    }

    const createdTag = await this.prisma.tagValue.findUnique({
      where: {
        dimensionId_path: {
          dimensionId: dto.dimensionId,
          path: normalizedPath,
        },
      },
    });

    return createdTag!;
  }

  async getEntityTags(
    entityType: string,
    entityId: string,
  ): Promise<
    Array<{
      entityType: string;
      entityId: string;
      tagValue: {
        id: string;
        dimensionId: string;
        path: string;
        label: string;
        depth: number;
        parentId: string | null;
      };
      taggedAt: Date;
    }>
  > {
    const entityTags = await this.prisma.entityTag.findMany({
      where: { entityType, entityId },
      include: {
        tagValue: {
          include: { dimension: { select: { name: true } } },
        },
      },
    });

    return entityTags.map((et) => ({
      entityType: et.entityType,
      entityId: et.entityId,
      tagValue: {
        id: et.tagValue.id,
        dimensionId: et.tagValue.dimensionId,
        path: et.tagValue.path,
        label: et.tagValue.label,
        depth: et.tagValue.depth,
        parentId: et.tagValue.parentId,
      },
      taggedAt: et.taggedAt,
    }));
  }

  async putEntityTags(
    entityType: string,
    entityId: string,
    dto: PutEntityTagsDto,
    userId: string,
  ): Promise<
    Array<{
      entityType: string;
      entityId: string;
      tagValue: {
        id: string;
        dimensionId: string;
        path: string;
        label: string;
        depth: number;
        parentId: string | null;
      };
      taggedAt: Date;
    }>
  > {
    await this.setCurrentUser(userId);

    const dimension = await this.prisma.tagDimension.findUnique({
      where: { id: dto.dimensionId },
    });

    if (!dimension) {
      throw new NotFoundException({
        code: 'DIMENSION_NOT_FOUND',
        message: 'Dimension not found',
      });
    }

    if (dto.tagValueIds.length > 0) {
      const tagValues = await this.prisma.tagValue.findMany({
        where: { id: { in: dto.tagValueIds } },
      });

      const wrongDimension = tagValues.filter(
        (tv) => tv.dimensionId !== dto.dimensionId,
      );

      if (wrongDimension.length > 0) {
        throw new BadRequestException({
          code: 'TAG_DIMENSION_MISMATCH',
          message: 'Tag value belongs to a different dimension',
        });
      }
    }

    await this.prisma.entityTag.deleteMany({
      where: {
        entityType,
        entityId,
        tagValue: { dimensionId: dto.dimensionId },
      },
    });

    if (dto.tagValueIds.length > 0) {
      await this.prisma.entityTag.createMany({
        data: dto.tagValueIds.map((tagValueId) => ({
          entityType,
          entityId,
          tagValueId,
          taggedById: userId,
        })),
      });
    }

    this.logger.log({
      method: 'putEntityTags',
      userId,
      entityType,
      entityId,
      dimensionId: dto.dimensionId,
      tagValueIds: dto.tagValueIds,
      result: 'updated',
    });

    return this.getEntityTags(entityType, entityId);
  }

  normalizePath(path: string): string {
    const trimmed = path.trim();
    const segments = trimmed.split('/').map((s) => s.trim().toLowerCase().replace(/\s+/g, '-'));

    const normalized = segments.filter((s) => s !== '').join('/');

    if (normalized.length === 0) {
      throw new BadRequestException({
        code: 'INVALID_TAG_PATH',
        message: 'Path cannot be empty',
      });
    }

    if (normalized.length > MAX_PATH_LENGTH) {
      throw new BadRequestException({
        code: 'INVALID_TAG_PATH',
        message: `Path exceeds maximum length of ${MAX_PATH_LENGTH}`,
      });
    }

    if (INVALID_PATH_CHARS.test(normalized)) {
      throw new BadRequestException({
        code: 'INVALID_TAG_PATH',
        message: 'Path contains invalid characters',
      });
    }

    return normalized;
  }

  getAncestorPaths(path: string): string[] {
    const segments = path.split('/');
    if (segments.length <= 1) {
      return [];
    }

    const ancestors: string[] = [];
    for (let i = 1; i < segments.length; i++) {
      ancestors.push(segments.slice(0, i).join('/'));
    }

    return ancestors;
  }

  labelFromPath(segment: string): string {
    return segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private async setCurrentUser(userId: string): Promise<void> {
    try {
      await this.prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`;
    } catch (error) {
      this.logger.warn(`Failed to set current user: ${error}`);
    }
  }
}
