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
import { BatchEntityTagsDto } from './dto/batch-entity-tags.dto';

const INVALID_PATH_CHARS = /[\\"'\x00-\x1F<>]/;
const MAX_PATH_LENGTH = 500;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    await this.prisma.setCurrentUser(userId);

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
    await this.prisma.setCurrentUser(userId);

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
      dimensionColor: string | null;
      path: string;
      label: string;
      depth: number;
      parentId: string | null;
    }>
  > {
    const dimensionParam = dimensionIdOrName?.trim();

    if (!dimensionParam) {
      throw new BadRequestException({
        code: 'DIMENSION_INVALID',
        message: 'Dimension parameter is required',
      });
    }

    const searchConditions: Array<Record<string, unknown>> = [];

    if (this.isUuid(dimensionParam)) {
      searchConditions.push({ id: dimensionParam });
    }

    searchConditions.push({
      name: {
        equals: dimensionParam,
        mode: 'insensitive',
      },
    });

    const dimension = await this.prisma.tagDimension.findFirst({
      where: searchConditions.length > 0 ? { OR: searchConditions } : undefined,
    });

    if (!dimension) {
      throw new NotFoundException({
        code: 'DIMENSION_NOT_FOUND',
        message: 'Dimension not found',
      });
    }

    const dimensionId = dimension.id;

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
      include: { dimension: { select: { name: true, color: true } } },
    });

    return values.map((v) => ({
      id: v.id,
      dimensionId: v.dimensionId,
      dimensionName: v.dimension.name,
      dimensionColor: v.dimension.color,
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
    dimensionName: string;
    dimensionColor: string | null;
    path: string;
    label: string;
    depth: number;
    parentId: string | null;
    createdAt: Date;
  }> {
    await this.prisma.setCurrentUser(userId);

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
      const dimension = await this.prisma.tagDimension.findUnique({
        where: { id: dto.dimensionId },
      });
      return {
        ...existing,
        dimensionName: dimension!.name,
        dimensionColor: dimension!.color,
      };
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
      include: { dimension: { select: { name: true, color: true } } },
    });

    return {
      ...createdTag!,
      dimensionName: createdTag!.dimension.name,
      dimensionColor: createdTag!.dimension.color,
    };
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
        dimensionName: string;
        dimensionColor: string | null;
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
          include: { dimension: { select: { name: true, color: true } } },
        },
      },
    });

    return entityTags.map((et) => ({
      entityType: et.entityType,
      entityId: et.entityId,
      tagValue: {
        id: et.tagValue.id,
        dimensionId: et.tagValue.dimensionId,
        dimensionName: et.tagValue.dimension.name,
        dimensionColor: et.tagValue.dimension.color,
        path: et.tagValue.path,
        label: et.tagValue.label,
        depth: et.tagValue.depth,
        parentId: et.tagValue.parentId,
      },
      taggedAt: et.taggedAt,
    }));
  }

  async getEntitiesTags(
    entityType: string,
    entityIds: string[],
  ): Promise<
    Array<{
      entityType: string;
      entityId: string;
      tagValue: {
        id: string;
        dimensionId: string;
        dimensionName: string;
        dimensionColor: string | null;
        path: string;
        label: string;
        depth: number;
        parentId: string | null;
      };
      taggedAt: Date;
    }>
  > {
    if (entityIds.length === 0) {
      return [];
    }

    const entityTags = await this.prisma.entityTag.findMany({
      where: {
        entityType,
        entityId: { in: entityIds },
      },
      include: {
        tagValue: {
          include: { dimension: { select: { name: true, color: true } } },
        },
      },
    });

    return entityTags.map((et) => ({
      entityType: et.entityType,
      entityId: et.entityId,
      tagValue: {
        id: et.tagValue.id,
        dimensionId: et.tagValue.dimensionId,
        dimensionName: et.tagValue.dimension.name,
        dimensionColor: et.tagValue.dimension.color,
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
        dimensionName: string;
        dimensionColor: string | null;
        path: string;
        label: string;
        depth: number;
        parentId: string | null;
      };
      taggedAt: Date;
    }>
  > {
    await this.prisma.setCurrentUser(userId);

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

  async batchEntityTags(
    entityType: string,
    entityId: string,
    dto: BatchEntityTagsDto,
    userId: string,
  ): Promise<
    Array<{
      entityType: string;
      entityId: string;
      tagValue: {
        id: string;
        dimensionId: string;
        dimensionName: string;
        dimensionColor: string | null;
        path: string;
        label: string;
        depth: number;
        parentId: string | null;
      };
      taggedAt: Date;
    }>
  > {
    await this.prisma.setCurrentUser(userId);

    // Validate all tag values exist
    let tagValues: Array<{ id: string; dimensionId: string }> = [];
    if (dto.tagValueIds.length > 0) {
      tagValues = await this.prisma.tagValue.findMany({
        where: { id: { in: dto.tagValueIds } },
        select: { id: true, dimensionId: true },
      });

      if (tagValues.length !== dto.tagValueIds.length) {
        const foundIds = new Set(tagValues.map((tv) => tv.id));
        const missingIds = dto.tagValueIds.filter((id) => !foundIds.has(id));
        throw new NotFoundException({
          code: 'TAG_VALUES_NOT_FOUND',
          message: `Tag values not found: ${missingIds.join(', ')}`,
        });
      }
    }

    // Delete all existing entity tags
    await this.prisma.entityTag.deleteMany({
      where: { entityType, entityId },
    });

    // Create new entity tags
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
      method: 'batchEntityTags',
      userId,
      entityType,
      entityId,
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

  private isUuid(str: string): boolean {
    return UUID_REGEX.test(str);
  }
}
