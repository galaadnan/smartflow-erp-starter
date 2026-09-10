import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionKey } from '../../generated/prisma/enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { AuditQueryDto } from './dto/audit-query.dto';
import { AuditService } from './audit.service';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermission(PermissionKey.AUDIT_READ)
  @ApiOperation({ summary: 'List audit logs' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: AuditQueryDto) {
    return this.auditService.findAll(user.companyId, query);
  }
}
