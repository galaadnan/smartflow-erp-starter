import { Module } from '@nestjs/common';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService, PermissionGuard],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
