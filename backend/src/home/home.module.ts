import { Module } from '@nestjs/common';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';

// AGENT-DECISION: back — FS-12 D-03 : HomeModule isolé — PrismaService injecté via PrismaModule global
// Pas d'import ApplicationsModule, BusinessCapabilitiesModule, etc.
@Module({
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
