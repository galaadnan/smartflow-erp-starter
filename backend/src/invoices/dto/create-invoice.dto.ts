import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  salesOrderId?: string;

  @ApiProperty({ example: '2026-09-30' })
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;
}
