import { Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Interface, Prisma } from '@prisma/client';
import { CreateInterfaceDto } from './dto/create-interface.dto';
import { UpdateInterfaceDto } from './dto/update-interface.dto';
import { QueryInterfaceDto } from './dto/query-interface.dto';

@Injectable()
export class InterfacesService {
  private readonly logger = new Logger(InterfacesService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async setCurrentUser(userId: string): Promise<void> {
    await this.prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`;
  }

  private async validateApplications(sourceAppId: string, targetAppId: string): Promise<void> {
    const [source, target] = await Promise.all([
      this.prisma.application.findUnique({ where: { id: sourceAppId } }),
      this.prisma.application.findUnique({ where: { id: targetAppId } }),
    ]);

    if (!source) {
      throw new NotFoundException({
        code: 'APPLICATION_NOT_FOUND',
        message: `Source application ${sourceAppId} not found`,
      });
    }

    if (!target) {
      throw new NotFoundException({
        code: 'APPLICATION_NOT_FOUND',
        message: `Target application ${targetAppId} not found`,
      });
    }
  }

  private validateSelfReference(sourceAppId: string, targetAppId: string): void {
    if (sourceAppId === targetAppId) {
      throw new UnprocessableEntityException({
        code: 'SELF_REFERENCE',
        message: 'sourceAppId and targetAppId must be different',
      });
    }
  }

  async create(dto: CreateInterfaceDto, userId: string): Promise<Interface> {
    this.validateSelfReference(dto.sourceAppId, dto.targetAppId);
    await this.validateApplications(dto.sourceAppId, dto.targetAppId);

    await this.setCurrentUser(userId);

    const { tagPaths, ...data } = dto;

    return this.prisma.interface.create({
      data: {
        ...data,
        errorRate: data.errorRate ? new Prisma.Decimal(data.errorRate) : null,
      },
      include: {
        sourceApp: { select: { id: true, name: true } },
        targetApp: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(query: QueryInterfaceDto): Promise<{ data: Interface[]; meta: any }> {
    const { page = 1, limit = 20, sourceAppId, targetAppId, type, criticality, search } = query;

    const where: Prisma.InterfaceWhereInput = {};

    if (sourceAppId) {
      where.sourceAppId = sourceAppId;
    }

    if (targetAppId) {
      where.targetAppId = targetAppId;
    }

    if (type) {
      where.type = type;
    }

    if (criticality) {
      where.criticality = criticality;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.interface.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          sourceApp: { select: { id: true, name: true } },
          targetApp: { select: { id: true, name: true } },
        },
      }),
      this.prisma.interface.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(id: string): Promise<Interface> {
    const iface = await this.prisma.interface.findUnique({
      where: { id },
      include: {
        sourceApp: { select: { id: true, name: true } },
        targetApp: { select: { id: true, name: true } },
      },
    });

    if (!iface) {
      throw new NotFoundException({
        code: 'INTERFACE_NOT_FOUND',
        message: `Interface ${id} not found`,
      });
    }

    return iface;
  }

  async update(id: string, dto: UpdateInterfaceDto, userId: string): Promise<Interface> {
    const existing = await this.prisma.interface.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException({
        code: 'INTERFACE_NOT_FOUND',
        message: `Interface ${id} not found`,
      });
    }

    const sourceAppId = dto.sourceAppId ?? existing.sourceAppId;
    const targetAppId = dto.targetAppId ?? existing.targetAppId;

    this.validateSelfReference(sourceAppId, targetAppId);
    await this.validateApplications(sourceAppId, targetAppId);

    await this.setCurrentUser(userId);

    const { tagPaths, ...data } = dto;

    return this.prisma.interface.update({
      where: { id },
      data: {
        ...data,
        errorRate: data.errorRate !== undefined 
          ? (data.errorRate ? new Prisma.Decimal(data.errorRate) : null) 
          : undefined,
      },
      include: {
        sourceApp: { select: { id: true, name: true } },
        targetApp: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.interface.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException({
        code: 'INTERFACE_NOT_FOUND',
        message: `Interface ${id} not found`,
      });
    }

    await this.prisma.interface.delete({ where: { id } });
  }
}
