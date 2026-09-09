import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionKey } from '../../generated/prisma/enums';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
import { InventoryQueryDto } from './dto/inventory-query.dto';
import { InventoryService } from './inventory.service';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @RequirePermission(PermissionKey.INVENTORY_READ)
  @ApiOperation({ summary: 'List inventory transactions' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: InventoryQueryDto) {
    return this.inventoryService.findAll(user.companyId, query);
  }

  @Get('stock/:productId')
  @RequirePermission(PermissionKey.INVENTORY_READ)
  @ApiOperation({ summary: 'Get current stock for a product' })
  getStock(@CurrentUser() user: AuthenticatedUser, @Param('productId') productId: string) {
    return this.inventoryService.getStock(user.companyId, productId);
  }

  @Get('product/:productId')
  @RequirePermission(PermissionKey.INVENTORY_READ)
  @ApiOperation({ summary: 'Get inventory history for a product' })
  findByProduct(@CurrentUser() user: AuthenticatedUser, @Param('productId') productId: string) {
    return this.inventoryService.findByProduct(user.companyId, productId);
  }

  @Post()
  @RequirePermission(PermissionKey.INVENTORY_CREATE)
  @ApiOperation({ summary: 'Record inventory transaction' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateInventoryTransactionDto) {
    return this.inventoryService.create(user.companyId, dto);
  }
}
