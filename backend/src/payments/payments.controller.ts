import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionKey } from '../../generated/prisma/enums';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequirePermission(PermissionKey.PAYMENTS_READ)
  @ApiOperation({ summary: 'List payments' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: PaymentQueryDto) {
    return this.paymentsService.findAll(user.companyId, query);
  }

  @Get(':id')
  @RequirePermission(PermissionKey.PAYMENTS_READ)
  @ApiOperation({ summary: 'Get payment by id' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.paymentsService.findOne(user.companyId, id);
  }

  @Post()
  @RequirePermission(PermissionKey.PAYMENTS_CREATE)
  @ApiOperation({ summary: 'Create a payment' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(user.companyId, dto);
  }

  @Patch(':id')
  @RequirePermission(PermissionKey.PAYMENTS_UPDATE)
  @ApiOperation({ summary: 'Update a payment' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(user.companyId, id, dto);
  }

  @Delete(':id')
  @RequirePermission(PermissionKey.PAYMENTS_DELETE)
  @ApiOperation({ summary: 'Delete a payment' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.paymentsService.remove(user.companyId, id);
  }
}
