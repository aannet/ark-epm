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
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('api/v1/data-objects')
export class DataObjectsController {
  constructor(private readonly dataObjectsService: DataObjectsService) {}

  @Get()
  @RequirePermission('data-objects:read')
  findAll(@Query() query: QueryDataObjectsDto) {
    return this.dataObjectsService.findAll(query);
  }

  @Post()
  @RequirePermission('data-objects:write')
  create(
    @Body() createDataObjectDto: CreateDataObjectDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.dataObjectsService.create(createDataObjectDto, req.user.sub);
  }

  @Get(':id')
  @RequirePermission('data-objects:read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.dataObjectsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('data-objects:write')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDataObjectDto: UpdateDataObjectDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.dataObjectsService.update(
      id,
      updateDataObjectDto,
      req.user.sub,
    );
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('data-objects:write')
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest) {
    return this.dataObjectsService.remove(id, req.user.sub);
  }

  @Get(':id/applications')
  @RequirePermission('data-objects:read')
  getApplications(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryDataObjectsDto,
  ) {
    return this.dataObjectsService.getApplications(id, query);
  }
}
