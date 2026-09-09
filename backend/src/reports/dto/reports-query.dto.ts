import { IsISO8601, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReportsQueryDto {
  @ApiPropertyOptional()
  @IsISO8601()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsISO8601()
  @IsOptional()
  dateTo?: string;
}
