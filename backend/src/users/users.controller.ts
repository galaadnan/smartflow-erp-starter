import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PermissionKey } from '../../generated/prisma/enums';
import {
  CurrentUser,
} from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermission(PermissionKey.USERS_MANAGE)
  @ApiOperation({ summary: 'List all users in the authenticated company' })
  @ApiResponse({ status: 200, description: 'Array of users (no passwordHash)' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing USERS_MANAGE permission' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findAll(user.companyId);
  }

  @Get(':id')
  @RequirePermission(PermissionKey.USERS_MANAGE)
  @ApiOperation({ summary: 'Get a user by ID (tenant-scoped)' })
  @ApiResponse({ status: 200, description: 'User object (no passwordHash)' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing USERS_MANAGE permission' })
  @ApiResponse({ status: 404, description: 'User not found or belongs to another company' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.findOne(user.companyId, id);
  }

  @Post()
  @RequirePermission(PermissionKey.USERS_MANAGE)
  @ApiOperation({ summary: 'Create a new user in the authenticated company' })
  @ApiResponse({ status: 201, description: 'Created user (no passwordHash)' })
  @ApiResponse({ status: 400, description: 'Validation error or cross-tenant role' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing USERS_MANAGE permission' })
  @ApiResponse({ status: 409, description: 'Duplicate email or username' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.create(user.companyId, dto);
  }

  @Patch(':id')
  @RequirePermission(PermissionKey.USERS_MANAGE)
  @ApiOperation({ summary: 'Update a user (tenant-scoped, cannot change companyId)' })
  @ApiResponse({ status: 200, description: 'Updated user (no passwordHash)' })
  @ApiResponse({ status: 400, description: 'Validation error or cross-tenant role' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing USERS_MANAGE permission' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Duplicate email or username' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(user.companyId, id, dto);
  }

  @Patch(':id/activate')
  @RequirePermission(PermissionKey.USERS_MANAGE)
  @ApiOperation({ summary: 'Activate a user' })
  @ApiResponse({ status: 200, description: 'User set to ACTIVE' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing USERS_MANAGE permission' })
  @ApiResponse({ status: 404, description: 'User not found' })
  activate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.setStatus(user.companyId, id, 'ACTIVE');
  }

  @Patch(':id/deactivate')
  @RequirePermission(PermissionKey.USERS_MANAGE)
  @ApiOperation({ summary: 'Deactivate a user' })
  @ApiResponse({ status: 200, description: 'User set to INACTIVE' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Missing USERS_MANAGE permission' })
  @ApiResponse({ status: 404, description: 'User not found' })
  deactivate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.setStatus(user.companyId, id, 'INACTIVE');
  }
}
