import { Module } from '@nestjs/common';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  providers: [CustomersService, PermissionGuard],
  controllers: [CustomersController],
  exports: [CustomersService],
})
export class CustomersModule {}
