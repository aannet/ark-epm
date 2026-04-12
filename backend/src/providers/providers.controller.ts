import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Req,
  Query,
} from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { QueryProvidersDto } from './dto/query-providers.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

interface AuthenticatedRequest {
  user: { id: string };
}

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  @RequirePermissions('providers:read')
  findAll(@Query() query: QueryProvidersDto) {
    return this.providersService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('providers:read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.providersService.findOne(id);
  }

  @Get(':id/applications')
  @RequirePermissions('providers:read')
  getApplications(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.providersService.getApplications(id, { page, limit });
  }

  @Post()
  @RequirePermissions('providers:write')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createProviderDto: CreateProviderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.providersService.create(createProviderDto, req.user.id);
  }

  @Patch(':id')
  @RequirePermissions('providers:write')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProviderDto: UpdateProviderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.providersService.update(id, updateProviderDto, req.user.id);
  }

  @Delete(':id')
  @RequirePermissions('providers:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.providersService.remove(id, req.user.id);
  }
}
