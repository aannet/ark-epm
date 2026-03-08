import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDimensionDto } from './dto/create-tag-dimension.dto';
import { UpdateTagDimensionDto } from './dto/update-tag-dimension.dto';
import { ResolveTagDto } from './dto/resolve-tag.dto';
import { PutEntityTagsDto } from './dto/put-entity-tags.dto';
import { AutocompleteQueryDto } from './dto/autocomplete-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

interface AuthenticatedRequest {
  user: { id: string };
}

@Controller()
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get('tag-dimensions')
  async findAllDimensions() {
    return this.tagsService.findAllDimensions();
  }

  @Post('tag-dimensions')
  @RequirePermissions('tags:write')
  async createDimension(
    @Body() dto: CreateTagDimensionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tagsService.createDimension(dto, req.user.id);
  }

  @Patch('tag-dimensions/:id')
  @RequirePermissions('tags:write')
  async updateDimension(
    @Param('id') id: string,
    @Body() dto: UpdateTagDimensionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tagsService.updateDimension(id, dto, req.user.id);
  }

  @Get('tags/autocomplete')
  async autocomplete(@Query() query: AutocompleteQueryDto) {
    return this.tagsService.autocomplete(
      query.dimension,
      query.query,
      query.limit ?? 20,
    );
  }

  @Post('tags/resolve')
  async resolveTag(
    @Body() dto: ResolveTagDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tagsService.resolveTag(dto, req.user.id);
  }

  @Get('tags/entity/:entityType/:entityId')
  async getEntityTags(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.tagsService.getEntityTags(entityType, entityId);
  }

  @Put('tags/entity/:entityType/:entityId')
  async putEntityTags(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Body() dto: PutEntityTagsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tagsService.putEntityTags(entityType, entityId, dto, req.user.id);
  }
}
