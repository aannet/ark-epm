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
} from '@nestjs/common';
import { DomainsService } from './domains.service';
import { CreateDomainDto } from './dto/create-domain.dto';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { Public } from '../common/decorators/public.decorator';

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
  create(@Body() createDomainDto: CreateDomainDto) {
    return this.domainsService.create(createDomainDto);
  }

  @Patch(':id')
  @RequirePermissions('domains:write')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDomainDto: UpdateDomainDto,
  ) {
    return this.domainsService.update(id, updateDomainDto);
  }

  @Delete(':id')
  @RequirePermissions('domains:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.domainsService.remove(id);
  }
}
