import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PublicUser } from '../users/user.types';
import { DashboardSummaryQueryDto } from './dto/dashboard-summary-query.dto';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: PublicUser,
    @Query() query: DashboardSummaryQueryDto,
  ) {
    return this.dashboardService.getSummary(user.id, query);
  }
}
