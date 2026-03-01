import {
  Injectable,
  NestMiddleware,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuditContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuditContextMiddleware.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const payload = this.jwt.verify<{ sub: string }>(token);
        
        await this.prisma.$executeRaw`SET LOCAL ark.current_user_id = ${payload.sub}`;
        this.logger.debug({ message: 'Audit context set', userId: payload.sub });
      } catch {
        this.logger.debug('Invalid token - audit context not set');
      }
    }

    next();
  }
}
