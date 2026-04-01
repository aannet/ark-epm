import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { DataObjectsService } from './data-objects.service';
import { CreateDataObjectDto } from './dto/create-data-object.dto';
import { UpdateDataObjectDto } from './dto/update-data-object.dto';
import { QueryDataObjectsDto } from './dto/query-data-objects.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

interface AuthenticatedRequest {
  user: { id: string };
}

@Controller('data-objects')
export class DataObjectsController {
  constructor(private readonly dataObjectsService: DataObjectsService) {}

  @Get()
  @RequirePermissions('data-objects:read')
  findAll(@Query() query: QueryDataObjectsDto) {
    return this.dataObjectsService.findAll(query);
  }

  @Post()
  @RequirePermissions('data-objects:write')
  create(
    @Body() createDataObjectDto: CreateDataObjectDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.dataObjectsService.create(createDataObjectDto, req.user.id);
  }

  @Get(':id')
  @RequirePermissions('data-objects:read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.dataObjectsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('data-objects:write')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDataObjectDto: UpdateDataObjectDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.dataObjectsService.update(
      id,
      updateDataObjectDto,
      req.user.id,
    );
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermissions('data-objects:write')
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest) {
    return this.dataObjectsService.remove(id, req.user.id);
  }

  @Get(':id/applications')
  @RequirePermissions('data-objects:read')
  getApplications(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryDataObjectsDto,
  ) {
    return this.dataObjectsService.getApplications(id, query);
  }
}
