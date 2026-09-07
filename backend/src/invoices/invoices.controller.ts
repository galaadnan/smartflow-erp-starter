import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PermissionKey } from '../../generated/prisma/enums';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoicesService } from './invoices.service';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @RequirePermission(PermissionKey.INVOICES_READ)
  @ApiOperation({ summary: 'List invoices in the authenticated company' })
  @ApiResponse({ status: 200, description: 'Paginated list of invoices' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing INVOICES_READ permission' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: InvoiceQueryDto,
  ) {
    return this.invoicesService.findAll(user.companyId, query);
  }

  @Get(':id')
  @RequirePermission(PermissionKey.INVOICES_READ)
  @ApiOperation({ summary: 'Get an invoice by ID (tenant-scoped)' })
  @ApiResponse({ status: 200, description: 'Invoice detail' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing INVOICES_READ permission' })
  @ApiResponse({ status: 404, description: 'Invoice not found or belongs to another company' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoicesService.findOne(user.companyId, id);
  }

  @Post()
  @RequirePermission(PermissionKey.INVOICES_CREATE)
  @ApiOperation({ summary: 'Create a new invoice in the authenticated company' })
  @ApiResponse({ status: 201, description: 'Created invoice' })
  @ApiResponse({ status: 400, description: 'Validation error or invalid customer/sales order' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing INVOICES_CREATE permission' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoicesService.create(user.companyId, dto);
  }

  @Patch(':id')
  @RequirePermission(PermissionKey.INVOICES_CREATE)
  @ApiOperation({ summary: 'Update invoice status, due date, or record a payment' })
  @ApiResponse({ status: 200, description: 'Updated invoice' })
  @ApiResponse({ status: 400, description: 'Validation error or payment exceeds total' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing INVOICES_CREATE permission' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(user.companyId, id, dto);
  }
}
