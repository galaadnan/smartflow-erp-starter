import { Module } from '@nestjs/common';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  providers: [InvoicesService, PermissionGuard],
  controllers: [InvoicesController],
  exports: [InvoicesService],
})
export class InvoicesModule {}
