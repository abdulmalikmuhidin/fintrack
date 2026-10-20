import { IsDateString, IsOptional, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardSummaryQueryDto {
  @ApiPropertyOptional({ example: '2026-10-01', format: 'date' })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @ApiPropertyOptional({ example: '2026-10-31', format: 'date' })
  endDate?: string;
}
