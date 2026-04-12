import { Module } from '@nestjs/common';
import { ItComponentsController } from './it-components.controller';
import { ItComponentsService } from './it-components.service';

@Module({
  controllers: [ItComponentsController],
  providers: [ItComponentsService],
})
export class ItComponentsModule {}
