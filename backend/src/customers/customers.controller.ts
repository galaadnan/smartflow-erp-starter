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
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermission(PermissionKey.CUSTOMERS_READ)
  @ApiOperation({ summary: 'List customers in the authenticated company' })
  @ApiResponse({ status: 200, description: 'Paginated list of customers' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing CUSTOMERS_READ permission' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CustomerQueryDto,
  ) {
    return this.customersService.findAll(user.companyId, query);
  }

  @Get(':id')
  @RequirePermission(PermissionKey.CUSTOMERS_READ)
  @ApiOperation({ summary: 'Get a customer by ID (tenant-scoped)' })
  @ApiResponse({ status: 200, description: 'Customer object' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing CUSTOMERS_READ permission' })
  @ApiResponse({ status: 404, description: 'Customer not found or belongs to another company' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.customersService.findOne(user.companyId, id);
  }

  @Post()
  @RequirePermission(PermissionKey.CUSTOMERS_CREATE)
  @ApiOperation({ summary: 'Create a new customer in the authenticated company' })
  @ApiResponse({ status: 201, description: 'Created customer' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing CUSTOMERS_CREATE permission' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.create(user.companyId, dto);
  }

  @Patch(':id')
  @RequirePermission(PermissionKey.CUSTOMERS_UPDATE)
  @ApiOperation({ summary: 'Update a customer (tenant-scoped)' })
  @ApiResponse({ status: 200, description: 'Updated customer' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing CUSTOMERS_UPDATE permission' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(user.companyId, id, dto);
  }

  @Patch(':id/activate')
  @RequirePermission(PermissionKey.CUSTOMERS_UPDATE)
  @ApiOperation({ summary: 'Activate a customer' })
  @ApiResponse({ status: 200, description: 'Customer set to ACTIVE' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing CUSTOMERS_UPDATE permission' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  activate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.customersService.setStatus(user.companyId, id, 'ACTIVE');
  }

  @Patch(':id/deactivate')
  @RequirePermission(PermissionKey.CUSTOMERS_UPDATE)
  @ApiOperation({ summary: 'Deactivate a customer' })
  @ApiResponse({ status: 200, description: 'Customer set to INACTIVE' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing CUSTOMERS_UPDATE permission' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  deactivate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.customersService.setStatus(user.companyId, id, 'INACTIVE');
  }
}
