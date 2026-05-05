import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  roleId?: string | null;
  // AGENT-DECISION: back — FS-12 D-06 : domaines assignés ([] = portée globale)
  domainIds?: string[];
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  roleId?: string | null;
  isActive?: boolean;
  // AGENT-DECISION: back — FS-12 D-06 : diff transactionnel domaine si présent
  domainIds?: string[];
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Valide que tous les domainIds fournis existent — lance NotFoundException si un UUID est invalide
  private async validateDomainIds(domainIds: string[]): Promise<void> {
    if (domainIds.length === 0) return;
    const found = await this.prisma.domain.findMany({
      where: { id: { in: domainIds } },
      select: { id: true },
    });
    if (found.length !== domainIds.length) {
      throw new NotFoundException({ code: 'DOMAIN_NOT_FOUND', message: 'One or more domains not found' });
    }
  }

  async create(data: CreateUserDto, currentUserId: string): Promise<any> {
    await this.prisma.setCurrentUser(currentUserId);

    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    if (data.domainIds && data.domainIds.length > 0) {
      await this.validateDomainIds(data.domainIds);
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
          // AGENT-DECISION: back — FS-12 D-06 : crée les entrées user_domain_scope lors de la création
          ...(data.domainIds && data.domainIds.length > 0 && {
            domainScopes: {
              createMany: {
                data: data.domainIds.map((domainId) => ({ domainId })),
              },
            },
          }),
        },
        include: {
          role: true,
          domainScopes: { include: { domain: { select: { id: true, name: true } } } },
        },
      });

      const { passwordHash: _passwordHash, domainScopes, ...rest } = user;
      return {
        ...rest,
        domainIds: domainScopes.map((ds) => ds.domainId),
        domains: domainScopes.map((ds) => ({ id: ds.domain.id, name: ds.domain.name })),
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to create user: ${error.message}`);
    }
  }

  async findAll(query?: { isActive?: boolean }): Promise<any[]> {
    // AGENT-DECISION: back — add optional isActive filter to unblock owner selector backend requirement (T-012).
    const where = query?.isActive === undefined ? undefined : { isActive: query.isActive };

    const users = await this.prisma.user.findMany({
      where,
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    });

    return users.map(({ passwordHash: _passwordHash, ...user }) => user);
  }

  async findOne(id: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: { include: { rolePermissions: { include: { permission: true } } } },
        // AGENT-DECISION: back — FS-12 D-06 : inclure domaines assignés dans GET /users/:id
        domainScopes: { include: { domain: { select: { id: true, name: true } } } },
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const { passwordHash: _passwordHash, domainScopes, ...rest } = user;
    return {
      ...rest,
      domainIds: domainScopes.map((ds) => ds.domainId),
      domains: domainScopes.map((ds) => ({ id: ds.domain.id, name: ds.domain.name })),
    };
  }

  async update(id: string, data: UpdateUserDto, currentUserId: string): Promise<any> {
    await this.prisma.setCurrentUser(currentUserId);

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    // AGENT-DECISION: back — FS-12 D-06 : diff transactionnel des domaines si domainIds est présent
    if (data.domainIds !== undefined) {
      await this.validateDomainIds(data.domainIds);
      await this.prisma.$transaction([
        this.prisma.userDomainScope.deleteMany({ where: { userId: id } }),
        ...(data.domainIds.length > 0
          ? [this.prisma.userDomainScope.createMany({
              data: data.domainIds.map((domainId) => ({ userId: id, domainId })),
            })]
          : []),
      ]);
    }

    try {
      const updated = await this.prisma.user.update({
        where: { id },
        data: {
          ...(data.firstName !== undefined && { firstName: data.firstName }),
          ...(data.lastName !== undefined && { lastName: data.lastName }),
          ...(data.roleId !== undefined && { roleId: data.roleId }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
        include: {
          role: true,
          domainScopes: { include: { domain: { select: { id: true, name: true } } } },
        },
      });

      const { passwordHash: _passwordHash, domainScopes, ...rest } = updated;
      return {
        ...rest,
        domainIds: domainScopes.map((ds) => ds.domainId),
        domains: domainScopes.map((ds) => ({ id: ds.domain.id, name: ds.domain.name })),
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to update user: ${error.message}`);
    }
  }

  async remove(id: string, currentUserId: string): Promise<void> {
    await this.prisma.setCurrentUser(currentUserId);

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
