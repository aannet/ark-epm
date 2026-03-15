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
  Req,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { QueryApplicationsDto } from './dto/query-applications.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

interface AuthenticatedRequest {
  user: { id: string };
}

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  @RequirePermissions('applications:read')
  findAll(@Query() query: QueryApplicationsDto) {
    return this.applicationsService.findAll(query);
  }

  @Post()
  @RequirePermissions('applications:write')
  create(
    @Body() createDto: CreateApplicationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.applicationsService.create(createDto, req.user.id);
  }

  @Get(':id')
  @RequirePermissions('applications:read')
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @Get(':id/dependencies')
  @RequirePermissions('applications:read')
  getDependencies(@Param('id') id: string) {
    return this.applicationsService.getDependencies(id);
  }

  @Patch(':id')
  @RequirePermissions('applications:write')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateApplicationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.applicationsService.update(id, updateDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('applications:write')
  async remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.applicationsService.remove(id, req.user.id);
  }
}
