import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateRoleDto {
  name: string;
  description?: string;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
}

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateRoleDto, currentUserId: string): Promise<any> {
    await this.prisma.$executeRaw`SET LOCAL ark.current_user_id = ${currentUserId}`;

    const existing = await this.prisma.role.findUnique({ where: { name: data.name } });
    if (existing) {
      throw new ConflictException('Role name already in use');
    }

    try {
      const role = await this.prisma.role.create({
        data: {
          name: data.name,
          description: data.description,
        },
      });
      return role;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to create role: ${error.message}`);
    }
  }

  async findAll(): Promise<any[]> {
    return this.prisma.role.findMany();
  }

  async findOne(id: string): Promise<any> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }

    return role;
  }

  async update(id: string, data: UpdateRoleDto, currentUserId: string): Promise<any> {
    await this.prisma.$executeRaw`SET LOCAL ark.current_user_id = ${currentUserId}`;

    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }

    try {
      const updated = await this.prisma.role.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
        },
      });
      return updated;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to update role: ${error.message}`);
    }
  }

  async remove(id: string, currentUserId: string): Promise<void> {
    await this.prisma.$executeRaw`SET LOCAL ark.current_user_id = ${currentUserId}`;

    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }

    const usersWithRole = await this.prisma.user.count({ where: { roleId: id } });
    if (usersWithRole > 0) {
      throw new ConflictException(`Role is assigned to ${usersWithRole} user(s)`);
    }

    await this.prisma.role.delete({ where: { id } });
  }

  async updatePermissions(id: string, permissionIds: string[], currentUserId: string): Promise<any> {
    await this.prisma.$executeRaw`SET LOCAL ark.current_user_id = ${currentUserId}`;

    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });

      for (const permissionId of permissionIds) {
        await tx.rolePermission.create({
          data: {
            roleId: id,
            permissionId,
          },
        });
      }
    });

    return this.findOne(id);
  }
}
