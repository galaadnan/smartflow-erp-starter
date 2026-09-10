import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { InvoiceStatus, PaymentStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, query: PaymentQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };

    if (query.status) where.status = query.status;
    if (query.paymentMethod) where.paymentMethod = query.paymentMethod;

    if (query.dateFrom || query.dateTo) {
      where.paymentDate = {
        ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
        ...(query.dateTo && { lte: new Date(query.dateTo) }),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          invoice: { select: { id: true, invoiceNo: true, total: true, status: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, companyId },
      include: {
        invoice: { select: { id: true, invoiceNo: true, total: true, balance: true, status: true } },
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async create(companyId: string, dto: CreatePaymentDto) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: dto.invoiceId, companyId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Cannot pay a cancelled invoice');
    }
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already fully paid');
    }

    const amount = new Prisma.Decimal(dto.amount);
    if (amount.greaterThan(invoice.balance)) {
      throw new BadRequestException(
        `Payment amount ${amount} exceeds outstanding balance ${invoice.balance}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          companyId,
          invoiceId: dto.invoiceId,
          amount,
          paymentMethod: dto.paymentMethod,
          status: PaymentStatus.COMPLETED,
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
          notes: dto.notes,
        },
        include: {
          invoice: { select: { id: true, invoiceNo: true } },
        },
      });

      const newPaidAmount = invoice.paidAmount.add(amount);
      const newBalance = invoice.total.sub(newPaidAmount);
      const newStatus = newBalance.isZero()
        ? InvoiceStatus.PAID
        : InvoiceStatus.PARTIAL;

      await tx.invoice.update({
        where: { id: dto.invoiceId },
        data: { paidAmount: newPaidAmount, balance: newBalance, status: newStatus },
      });

      return payment;
    });
  }

  async update(companyId: string, id: string, dto: UpdatePaymentDto) {
    await this.findOne(companyId, id);
    return this.prisma.payment.update({
      where: { id },
      data: {
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.paymentDate !== undefined && { paymentDate: new Date(dto.paymentDate) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    await this.prisma.payment.delete({ where: { id } });
    return { message: 'Payment deleted' };
  }
}
