import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import type { CreateUserDto, UpdateUserDto } from './users.service';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateMeDto } from './dto/update-me.dto';

@Controller('users')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @RequirePermissions('users:read')
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('users:read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermissions('users:write')
  create(@Body() data: CreateUserDto, @Request() req: any) {
    return this.usersService.create(data, req.user.userId);
  }

  // AGENT-DECISION: back — FS-13 D-03 : self-update préférences, JWT seul (pas de permission RBAC)
  // ⚠️ Déclaré AVANT @Patch(':id') — NestJS matche les routes dans l'ordre
  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  updateMe(@Body() dto: UpdateMeDto, @Request() req: any) {
    return this.usersService.updateMe(req.user.userId, dto);
  }

  @Patch(':id')
  @RequirePermissions('users:write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() data: UpdateUserDto, @Request() req: any) {
    return this.usersService.update(id, data, req.user.userId);
  }

  @Delete(':id')
  @RequirePermissions('users:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.usersService.remove(id, req.user.userId);
  }
}
