import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

export interface RefreshTokenData {
  token: string;
  hashedToken: string;
  expiresAt: Date;
}

@Injectable()
export class RefreshTokenService {
  constructor(private prisma: PrismaService) {}

  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 7;

  async generateRefreshToken(userId: string): Promise<RefreshTokenData> {
    const token = randomUUID();
    const hashedToken = await bcrypt.hash(token, 12);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);

    await this.prisma.refreshToken.upsert({
      where: { userId },
      update: {
        tokenHash: hashedToken,
        expiresAt,
      },
      create: {
        userId,
        tokenHash: hashedToken,
        expiresAt,
      },
    });

    return { token, hashedToken, expiresAt };
  }

  async validateRefreshToken(token: string): Promise<{ userId: string } | null> {
    const refreshTokenRecord = await this.prisma.refreshToken.findFirst({
      where: {
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!refreshTokenRecord) {
      return null;
    }

    const isValid = await bcrypt.compare(token, refreshTokenRecord.tokenHash);
    if (!isValid) {
      return null;
    }

    if (!refreshTokenRecord.user.isActive) {
      return null;
    }

    return { userId: refreshTokenRecord.userId };
  }

  async revokeRefreshToken(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async rotateRefreshToken(userId: string, oldToken: string): Promise<RefreshTokenData | null> {
    const isValid = await this.validateRefreshToken(oldToken);
    if (!isValid || isValid.userId !== userId) {
      return null;
    }

    await this.revokeRefreshToken(userId);
    return this.generateRefreshToken(userId);
  }
}
