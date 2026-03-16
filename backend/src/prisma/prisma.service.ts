import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected');
  }

  async setCurrentUser(userId: string): Promise<void> {
    if (!userId || !UUID_REGEX.test(userId)) {
      this.logger.warn(`Refusing to set audit user with invalid id: ${userId}`);
      return;
    }

    try {
      await this.$executeRawUnsafe(
        `SET LOCAL "ark.current_user_id" = '${userId}'`,
      );
    } catch (error) {
      this.logger.warn(`Failed to set current user: ${error}`);
    }
  }
}
