import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PublicUser } from '../users/user.types';
import { DashboardSummaryQueryDto } from './dto/dashboard-summary-query.dto';
import { DashboardService } from './dashboard.service';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
@ApiTags('Dashboard')
@ApiCookieAuth('fintrack_session')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get currency-separated balance and reporting-period summary',
  })
  @ApiQuery({ type: DashboardSummaryQueryDto })
  @ApiOkResponse({
    description:
      'All money values are integer minor units. Totals are kept separate per currency.',
  })
  @ApiUnauthorizedResponse({ description: 'Session is missing, invalid, or expired.' })
  summary(
    @CurrentUser() user: PublicUser,
    @Query() query: DashboardSummaryQueryDto,
  ) {
    return this.dashboardService.getSummary(user.id, query);
  }
}
