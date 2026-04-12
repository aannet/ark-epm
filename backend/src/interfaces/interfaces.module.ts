import { Module } from '@nestjs/common';
import { InterfacesService } from './interfaces.service';
import { InterfacesController } from './interfaces.controller';

@Module({
  controllers: [InterfacesController],
  providers: [InterfacesService],
})
export class InterfacesModule {}
