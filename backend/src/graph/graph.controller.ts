import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { GraphService } from './graph.service';
import { QueryGraphDto } from './dto/query-graph.dto';
import { GraphResponse } from './dto/graph-response.dto';

@Controller('graph')
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  @Get()
  @RequirePermissions('applications:read')
  getGraph(@Query() query: QueryGraphDto): Promise<GraphResponse> {
    return this.graphService.buildGraph(query);
  }
}
