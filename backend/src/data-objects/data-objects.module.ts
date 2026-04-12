import { Module } from '@nestjs/common';
import { DataObjectsService } from './data-objects.service';
import { DataObjectsController } from './data-objects.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TagsModule } from '../tags/tags.module';

@Module({
  imports: [PrismaModule, TagsModule],
  controllers: [DataObjectsController],
  providers: [DataObjectsService],
  exports: [DataObjectsService],
})
export class DataObjectsModule {}
