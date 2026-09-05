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
import { PermissionKey, SalesOrderStatus } from '../../generated/prisma/enums';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { SalesQueryDto } from './dto/sales-query.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { SalesService } from './sales.service';

@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales/orders')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @RequirePermission(PermissionKey.SALES_READ)
  @ApiOperation({ summary: 'List sales orders in the authenticated company' })
  @ApiResponse({ status: 200, description: 'Paginated list of sales orders' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing SALES_READ permission' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SalesQueryDto,
  ) {
    return this.salesService.findAll(user.companyId, query);
  }

  @Get(':id')
  @RequirePermission(PermissionKey.SALES_READ)
  @ApiOperation({ summary: 'Get a sales order by ID (tenant-scoped)' })
  @ApiResponse({ status: 200, description: 'Sales order with customer and items' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing SALES_READ permission' })
  @ApiResponse({ status: 404, description: 'Sales order not found or belongs to another company' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.salesService.findOne(user.companyId, id);
  }

  @Post()
  @RequirePermission(PermissionKey.SALES_CREATE)
  @ApiOperation({ summary: 'Create a new sales order in the authenticated company' })
  @ApiResponse({ status: 201, description: 'Created sales order' })
  @ApiResponse({ status: 400, description: 'Validation error or invalid product/customer' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing SALES_CREATE permission' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSalesOrderDto,
  ) {
    return this.salesService.create(user.companyId, dto);
  }

  @Patch(':id')
  @RequirePermission(PermissionKey.SALES_UPDATE)
  @ApiOperation({ summary: 'Update notes or status of a sales order (tenant-scoped)' })
  @ApiResponse({ status: 200, description: 'Updated sales order' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing SALES_UPDATE permission' })
  @ApiResponse({ status: 404, description: 'Sales order not found' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSalesOrderDto,
  ) {
    return this.salesService.update(user.companyId, id, dto);
  }

  @Patch(':id/confirm')
  @RequirePermission(PermissionKey.SALES_UPDATE)
  @ApiOperation({ summary: 'Confirm a sales order' })
  @ApiResponse({ status: 200, description: 'Sales order set to CONFIRMED' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing SALES_UPDATE permission' })
  @ApiResponse({ status: 404, description: 'Sales order not found' })
  confirm(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.salesService.setStatus(user.companyId, id, SalesOrderStatus.CONFIRMED);
  }

  @Patch(':id/cancel')
  @RequirePermission(PermissionKey.SALES_UPDATE)
  @ApiOperation({ summary: 'Cancel a sales order' })
  @ApiResponse({ status: 200, description: 'Sales order set to CANCELLED' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing SALES_UPDATE permission' })
  @ApiResponse({ status: 404, description: 'Sales order not found' })
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.salesService.setStatus(user.companyId, id, SalesOrderStatus.CANCELLED);
  }
}
