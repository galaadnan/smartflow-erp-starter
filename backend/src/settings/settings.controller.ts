import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionKey } from '../../generated/prisma/enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermission(PermissionKey.SETTINGS_READ)
  @ApiOperation({ summary: 'Get company settings' })
  findOne(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.findOne(user.companyId);
  }

  @Patch()
  @RequirePermission(PermissionKey.SETTINGS_UPDATE)
  @ApiOperation({ summary: 'Update company settings' })
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(user.companyId, dto);
  }
}
