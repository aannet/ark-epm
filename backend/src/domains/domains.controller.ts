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
} from '@nestjs/common';
import { DomainsService } from './domains.service';
import { CreateDomainDto } from './dto/create-domain.dto';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

interface AuthenticatedRequest {
  user: { id: string };
}

@Controller('domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Get()
  @RequirePermissions('domains:read')
  findAll() {
    return this.domainsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('domains:read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.domainsService.findOne(id);
  }

  @Post()
  @RequirePermissions('domains:write')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createDomainDto: CreateDomainDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.domainsService.create(createDomainDto, req.user.id);
  }

  @Patch(':id')
  @RequirePermissions('domains:write')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDomainDto: UpdateDomainDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.domainsService.update(id, updateDomainDto, req.user.id);
  }

  @Delete(':id')
  @RequirePermissions('domains:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.domainsService.remove(id, req.user.id);
  }
}
