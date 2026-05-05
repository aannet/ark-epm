import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { JwtStrategy } from './auth/jwt.strategy';
import { AuditContextMiddleware } from './common/middleware/audit-context.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { DomainsModule } from './domains/domains.module';
import { ApplicationsModule } from './applications/applications.module';
import { TagsModule } from './tags/tags.module';

import { ProvidersModule } from './providers/providers.module';
import { ItComponentsModule } from './it-components/it-components.module';
import { DataObjectsModule } from './data-objects/data-objects.module';
import { BusinessCapabilitiesModule } from './business-capabilities/business-capabilities.module';
import { InterfacesModule } from './interfaces/interfaces.module';
import { SearchModule } from './search/search.module';
import { GraphModule } from './graph/graph.module';
import { HomeModule } from './home/home.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config: Record<string, unknown>) => {
        const jwtSecret = config['JWT_SECRET'];
        if (!jwtSecret || typeof jwtSecret !== 'string') {
          throw new Error('JWT_SECRET is required and must be a string');
        }
        if (jwtSecret.length < 32) {
          throw new Error(`JWT_SECRET must be at least 32 characters long (current: ${jwtSecret.length})`);
        }
        return config;
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '15m'),
        },
      }),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    DomainsModule,
    ApplicationsModule,
    TagsModule,
    ProvidersModule,
    ItComponentsModule,
    DataObjectsModule,
    BusinessCapabilitiesModule,
    InterfacesModule,
    SearchModule,
    GraphModule,
    HomeModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes('*')
      .apply(AuditContextMiddleware)
      .forRoutes('*');
  }
}
