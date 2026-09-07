import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsDecimal,
  IsEnum,
  IsOptional,
  IsPositive,
  IsNumber,
} from 'class-validator';
import { InvoiceStatus } from '../../../generated/prisma/enums';

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ enum: InvoiceStatus })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @ApiPropertyOptional({ example: '2026-10-15' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Amount received — added to paidAmount' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  payment?: number;
}
