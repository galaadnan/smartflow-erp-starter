import { Module } from '@nestjs/common';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  providers: [ProductsService, PermissionGuard],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
