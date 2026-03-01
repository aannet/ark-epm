import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreatePermissionDto {
  name: string;
  description?: string;
}

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePermissionDto, currentUserId: string): Promise<any> {
    await this.prisma.$executeRaw`SET LOCAL ark.current_user_id = ${currentUserId}`;

    const existing = await this.prisma.permission.findUnique({ where: { name: data.name } });
    if (existing) {
      throw new ConflictException('Permission name already in use');
    }

    const namePattern = /^([a-z]+):([a-z]+)$/;
    if (!namePattern.test(data.name)) {
      throw new BadRequestException('Permission name must be in format <resource>:<action>');
    }

    try {
      const permission = await this.prisma.permission.create({
        data: {
          name: data.name,
          description: data.description,
        },
      });
      return permission;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to create permission: ${error.message}`);
    }
  }

  async findAll(): Promise<any[]> {
    return this.prisma.permission.findMany();
  }
}
