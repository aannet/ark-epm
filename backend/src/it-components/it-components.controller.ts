import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { ItComponentsService } from './it-components.service';
import { CreateItComponentDto } from './dto/create-it-component.dto';
import { UpdateItComponentDto } from './dto/update-it-component.dto';
import { QueryItComponentsDto } from './dto/query-it-components.dto';
import { QueryItComponentApplicationsDto } from './dto/query-it-component-applications.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

interface AuthenticatedRequest {
  user: { id: string };
}

@Controller('it-components')
export class ItComponentsController {
  constructor(private readonly itComponentsService: ItComponentsService) {}

  @Get()
  @RequirePermissions('it-components:read')
  findAll(@Query() query: QueryItComponentsDto) {
    return this.itComponentsService.findAll(query);
  }

  @Post()
  @RequirePermissions('it-components:write')
  create(
    @Body() createDto: CreateItComponentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.itComponentsService.create(createDto, req.user.id);
  }

  @Get(':id')
  @RequirePermissions('it-components:read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.itComponentsService.findOne(id);
  }

  @Get(':id/applications')
  @RequirePermissions('it-components:read')
  getApplications(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryItComponentApplicationsDto,
  ) {
    return this.itComponentsService.getApplications(id, query);
  }

  @Patch(':id')
  @RequirePermissions('it-components:write')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateItComponentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.itComponentsService.update(id, updateDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('it-components:write')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.itComponentsService.remove(id, req.user.id);
  }
}
