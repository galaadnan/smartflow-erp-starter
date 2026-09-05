import { ApiPropertyOptional } from '@nestjs/swagger';
import { SalesOrderStatus } from '../../../generated/prisma/enums';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateSalesOrderDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ enum: SalesOrderStatus })
  @IsEnum(SalesOrderStatus)
  @IsOptional()
  status?: SalesOrderStatus;
}
