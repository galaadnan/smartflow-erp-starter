import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Decimal } from '../../generated/prisma/runtime/library';
import { InvoiceStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, query: InvoiceQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.customer = {
        name: { contains: query.search, mode: 'insensitive' },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          salesOrder: { select: { id: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(companyId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        salesOrder: {
          include: {
            items: {
              include: {
                product: { select: { id: true, sku: true, name: true } },
              },
            },
          },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async create(companyId: string, dto: CreateInvoiceDto) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, companyId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    let total = new Decimal(0);

    if (dto.salesOrderId) {
      const order = await this.prisma.salesOrder.findFirst({
        where: { id: dto.salesOrderId, companyId, customerId: dto.customerId },
      });
      if (!order) {
        throw new BadRequestException(
          'Sales order not found or does not belong to this customer and company',
        );
      }
      total = order.totalAmount;
    }

    const invoiceNo = await this.generateInvoiceNo(companyId);

    return this.prisma.invoice.create({
      data: {
        companyId,
        customerId: dto.customerId,
        salesOrderId: dto.salesOrderId ?? null,
        invoiceNo,
        status: InvoiceStatus.DRAFT,
        total,
        paidAmount: new Decimal(0),
        balance: total,
        dueDate: new Date(dto.dueDate),
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        salesOrder: { select: { id: true } },
      },
    });
  }

  async update(companyId: string, id: string, dto: UpdateInvoiceDto) {
    const invoice = await this.findOne(companyId, id);

    if (
      invoice.status === InvoiceStatus.CANCELLED &&
      dto.status !== undefined
    ) {
      throw new BadRequestException('Cannot update a cancelled invoice');
    }

    let newPaidAmount = invoice.paidAmount;
    let newStatus = dto.status ?? invoice.status;

    if (dto.payment !== undefined) {
      newPaidAmount = invoice.paidAmount.add(new Decimal(dto.payment));
      if (newPaidAmount.greaterThan(invoice.total)) {
        throw new BadRequestException('Payment exceeds invoice total');
      }
      if (newPaidAmount.equals(invoice.total)) {
        newStatus = InvoiceStatus.PAID;
      } else if (newPaidAmount.greaterThan(0)) {
        newStatus = InvoiceStatus.PARTIAL;
      }
    }

    const newBalance = invoice.total.sub(newPaidAmount);

    return this.prisma.invoice.update({
      where: { id },
      data: {
        ...(dto.status !== undefined && dto.payment === undefined && { status: newStatus }),
        ...(dto.payment !== undefined && { status: newStatus, paidAmount: newPaidAmount, balance: newBalance }),
        ...(dto.dueDate !== undefined && { dueDate: new Date(dto.dueDate) }),
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        salesOrder: { select: { id: true } },
      },
    });
  }

  private async generateInvoiceNo(companyId: string): Promise<string> {
    const count = await this.prisma.invoice.count({ where: { companyId } });
    const seq = String(count + 1).padStart(5, '0');
    return `INV-${seq}`;
  }
}
