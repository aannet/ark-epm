import { Controller, Get, Post, Patch, Delete, Put, Body, Param, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesService } from './roles.service';
import type { CreateRoleDto, UpdateRoleDto } from './roles.service';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('roles')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @RequirePermissions('roles:read')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('roles:read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @RequirePermissions('roles:write')
  create(@Body() data: CreateRoleDto, @Request() req: any) {
    return this.rolesService.create(data, req.user.userId);
  }

  @Patch(':id')
  @RequirePermissions('roles:write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() data: UpdateRoleDto, @Request() req: any) {
    return this.rolesService.update(id, data, req.user.userId);
  }

  @Delete(':id')
  @RequirePermissions('roles:write')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.rolesService.remove(id, req.user.userId);
  }

  @Put(':id/permissions')
  @RequirePermissions('roles:write')
  updatePermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: { permissionIds: string[] },
    @Request() req: any,
  ) {
    return this.rolesService.updatePermissions(id, data.permissionIds, req.user.userId);
  }
}
