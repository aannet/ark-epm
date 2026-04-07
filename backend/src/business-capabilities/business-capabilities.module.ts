import { Module } from '@nestjs/common';
import { BusinessCapabilitiesController } from './business-capabilities.controller';
import { BusinessCapabilitiesService } from './business-capabilities.service';

@Module({
  controllers: [BusinessCapabilitiesController],
  providers: [BusinessCapabilitiesService],
  exports: [BusinessCapabilitiesService],
})
export class BusinessCapabilitiesModule {}
