import { Injectable, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  roleId?: string | null;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  roleId?: string | null;
  isActive?: boolean;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserDto, currentUserId: string): Promise<any> {
    await this.prisma.$executeRaw`SET LOCAL ark.current_user_id = ${currentUserId}`;

    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          roleId: data.roleId,
        },
        include: { role: true },
      });

      const { passwordHash: _, ...result } = user;
      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to create user: ${error.message}`);
    }
  }

  async findAll(): Promise<any[]> {
    const users = await this.prisma.user.findMany({
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    });

    return users.map(({ passwordHash, ...user }) => user);
  }

  async findOne(id: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async update(id: string, data: UpdateUserDto, currentUserId: string): Promise<any> {
    await this.prisma.$executeRaw`SET LOCAL ark.current_user_id = ${currentUserId}`;

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    try {
      const updated = await this.prisma.user.update({
        where: { id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          roleId: data.roleId,
          isActive: data.isActive,
        },
        include: { role: true },
      });

      const { passwordHash, ...result } = updated;
      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to update user: ${error.message}`);
    }
  }

  async remove(id: string, currentUserId: string): Promise<void> {
    await this.prisma.$executeRaw`SET LOCAL ark.current_user_id = ${currentUserId}`;

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
