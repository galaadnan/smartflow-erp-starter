import { ApiPropertyOptional } from '@nestjs/swagger';
import { SalesOrderStatus } from '../../../generated/prisma/enums';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class SalesQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: SalesOrderStatus })
  @IsEnum(SalesOrderStatus)
  @IsOptional()
  status?: SalesOrderStatus;
}
