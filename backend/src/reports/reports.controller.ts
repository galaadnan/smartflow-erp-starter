import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionKey } from '../../generated/prisma/enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { ReportsQueryDto } from './dto/reports-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @RequirePermission(PermissionKey.REPORTS_READ)
  @ApiOperation({ summary: 'Sales report' })
  getSales(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportsQueryDto) {
    return this.reportsService.getSalesReport(user.companyId, query);
  }

  @Get('inventory')
  @RequirePermission(PermissionKey.REPORTS_READ)
  @ApiOperation({ summary: 'Inventory report' })
  getInventory(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.getInventoryReport(user.companyId);
  }

  @Get('customers')
  @RequirePermission(PermissionKey.REPORTS_READ)
  @ApiOperation({ summary: 'Customer report' })
  getCustomers(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportsQueryDto) {
    return this.reportsService.getCustomerReport(user.companyId, query);
  }

  @Get('financial')
  @RequirePermission(PermissionKey.REPORTS_READ)
  @ApiOperation({ summary: 'Financial summary report' })
  getFinancial(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportsQueryDto) {
    return this.reportsService.getFinancialReport(user.companyId, query);
  }
}
