import { Module } from '@nestjs/common';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  providers: [SalesService, PermissionGuard],
  controllers: [SalesController],
  exports: [SalesService],
})
export class SalesModule {}
