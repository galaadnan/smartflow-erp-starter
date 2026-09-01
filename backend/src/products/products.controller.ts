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
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequirePermission(PermissionKey.PRODUCTS_READ)
  @ApiOperation({ summary: 'List products in the authenticated company' })
  @ApiResponse({ status: 200, description: 'Paginated list of products' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing PRODUCTS_READ permission' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ProductQueryDto,
  ) {
    return this.productsService.findAll(user.companyId, query);
  }

  @Get(':id')
  @RequirePermission(PermissionKey.PRODUCTS_READ)
  @ApiOperation({ summary: 'Get a product by ID (tenant-scoped)' })
  @ApiResponse({ status: 200, description: 'Product object' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing PRODUCTS_READ permission' })
  @ApiResponse({ status: 404, description: 'Product not found or belongs to another company' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.findOne(user.companyId, id);
  }

  @Post()
  @RequirePermission(PermissionKey.PRODUCTS_CREATE)
  @ApiOperation({ summary: 'Create a new product in the authenticated company' })
  @ApiResponse({ status: 201, description: 'Created product' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing PRODUCTS_CREATE permission' })
  @ApiResponse({ status: 409, description: 'SKU already exists in this company' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(user.companyId, dto);
  }

  @Patch(':id')
  @RequirePermission(PermissionKey.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Update a product (tenant-scoped)' })
  @ApiResponse({ status: 200, description: 'Updated product' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing PRODUCTS_UPDATE permission' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'SKU already exists in this company' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(user.companyId, id, dto);
  }

  @Patch(':id/activate')
  @RequirePermission(PermissionKey.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Activate a product' })
  @ApiResponse({ status: 200, description: 'Product set to ACTIVE' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing PRODUCTS_UPDATE permission' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  activate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.setStatus(user.companyId, id, 'ACTIVE');
  }

  @Patch(':id/deactivate')
  @RequirePermission(PermissionKey.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Deactivate a product' })
  @ApiResponse({ status: 200, description: 'Product set to INACTIVE' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing PRODUCTS_UPDATE permission' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  deactivate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.setStatus(user.companyId, id, 'INACTIVE');
  }
}
