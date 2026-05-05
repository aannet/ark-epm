import { Controller, Get, Request } from '@nestjs/common';
import { HomeService } from './home.service';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

// AGENT-DECISION: back — FS-12 D-03 : HomeController — GET /api/v1/home/summary
// Permission applications:read réutilisée (RM-11). JwtAuthGuard global par défaut.
@Controller('home')
@RequirePermissions('applications:read')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('summary')
  getSummary(@Request() req: any) {
    return this.homeService.getSummary(req.user.userId);
  }
}
