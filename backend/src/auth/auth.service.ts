import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    });

    if (!user) {
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account disabled');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        role: user.role ? {
          id: user.role.id,
          name: user.role.name,
          description: user.role.description,
          createdAt: user.role.createdAt,
          permissions: user.role.rolePermissions?.map((rp: any) => ({
            name: rp.permission.name,
            description: rp.permission.description,
          })) || [],
        } : null,
        createdAt: user.createdAt,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const { passwordHash, ...result } = user;
    return result;
  }
}
