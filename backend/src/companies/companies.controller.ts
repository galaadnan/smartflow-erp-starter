import { Controller, ForbiddenException, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompaniesService } from './companies.service';

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
  ) {}

  @Get()
  findOwn(@CurrentUser() user: AuthenticatedUser) {
    return this.companiesService.findOwn(user.companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Disabled — company creation requires platform-level authorization not yet implemented' })
  create() {
    throw new ForbiddenException('Company creation is not available via this endpoint');
  }
}
