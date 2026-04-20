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
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { BusinessCapabilitiesService } from './business-capabilities.service';
import { CreateBusinessCapabilityDto } from './dto/create-business-capability.dto';
import { UpdateBusinessCapabilityDto } from './dto/update-business-capability.dto';
import { QueryBusinessCapabilitiesDto } from './dto/query-business-capabilities.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

interface AuthenticatedRequest {
  user: { id: string };
}

@Controller('business-capabilities')
export class BusinessCapabilitiesController {
  constructor(
    private readonly businessCapabilitiesService: BusinessCapabilitiesService,
  ) {}

  @Get()
  @RequirePermissions('business-capabilities:read')
  findAll(@Query() query: QueryBusinessCapabilitiesDto) {
    return this.businessCapabilitiesService.findAll(query);
  }

  @Get('tree')
  @RequirePermissions('business-capabilities:read')
  findTree(@Query() query: QueryBusinessCapabilitiesDto) {
    return this.businessCapabilitiesService.findTree(query);
  }

  @Get(':id')
  @RequirePermissions('business-capabilities:read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.businessCapabilitiesService.findOne(id);
  }

  @Get(':id/children')
  @RequirePermissions('business-capabilities:read')
  getChildren(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.businessCapabilitiesService.getChildren(
      id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get(':id/applications')
  @RequirePermissions('business-capabilities:read')
  getApplications(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.businessCapabilitiesService.getApplications(
      id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Post()
  @RequirePermissions('business-capabilities:write')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createDto: CreateBusinessCapabilityDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.businessCapabilitiesService.create(createDto, req.user.id);
  }

  @Patch(':id')
  @RequirePermissions('business-capabilities:write')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateBusinessCapabilityDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.businessCapabilitiesService.update(id, updateDto, req.user.id);
  }

  @Delete(':id')
  @RequirePermissions('business-capabilities:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.businessCapabilitiesService.remove(id, req.user.id);
  }
}
