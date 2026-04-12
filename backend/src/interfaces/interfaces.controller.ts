import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InterfacesService } from './interfaces.service';
import { CreateInterfaceDto } from './dto/create-interface.dto';
import { UpdateInterfaceDto } from './dto/update-interface.dto';
import { QueryInterfaceDto } from './dto/query-interface.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { Request } from 'express';

@Controller('api/v1/interfaces')
export class InterfacesController {
  constructor(private readonly interfacesService: InterfacesService) {}

  @Post()
  @RequirePermissions('interfaces:write')
  create(@Body() dto: CreateInterfaceDto, @Req() req: Request) {
    const userId = (req as any).user?.userId;
    return this.interfacesService.create(dto, userId);
  }

  @Get()
  @RequirePermissions('interfaces:read')
  findAll(@Query() query: QueryInterfaceDto) {
    return this.interfacesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('interfaces:read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.interfacesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('interfaces:write')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInterfaceDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.userId;
    return this.interfacesService.update(id, dto, userId);
  }

  @Delete(':id')
  @RequirePermissions('interfaces:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.interfacesService.remove(id);
  }
}
