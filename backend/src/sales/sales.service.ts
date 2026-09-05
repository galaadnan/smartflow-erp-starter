import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SalesOrderStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { SalesQueryDto } from './dto/sales-query.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, query: SalesQueryDto) {
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
      this.prisma.salesOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          items: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              subtotal: true,
            },
          },
        },
      }),
      this.prisma.salesOrder.count({ where }),
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
    const order = await this.prisma.salesOrder.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: { id: true, sku: true, name: true, salePrice: true },
            },
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Sales order not found');
    return order;
  }

  async create(companyId: string, dto: CreateSalesOrderDto) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, companyId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, companyId },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException(
        'One or more products not found or belong to another company',
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    const itemsData = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = product.salePrice;
      const subtotal = unitPrice.mul(item.quantity);
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        subtotal,
      };
    });

    const totalAmount = itemsData
      .slice(1)
      .reduce((sum, item) => sum.add(item.subtotal), itemsData[0].subtotal);

    return this.prisma.$transaction(async (tx) => {
      return tx.salesOrder.create({
        data: {
          companyId,
          customerId: dto.customerId,
          notes: dto.notes,
          status: SalesOrderStatus.DRAFT,
          totalAmount,
          items: {
            create: itemsData,
          },
        },
        include: {
          customer: true,
          items: {
            include: {
              product: {
                select: { id: true, sku: true, name: true, salePrice: true },
              },
            },
          },
        },
      });
    });
  }

  async update(companyId: string, id: string, dto: UpdateSalesOrderDto) {
    await this.findOne(companyId, id);
    return this.prisma.salesOrder.update({
      where: { id },
      data: {
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async setStatus(companyId: string, id: string, status: SalesOrderStatus) {
    await this.findOne(companyId, id);
    return this.prisma.salesOrder.update({
      where: { id },
      data: { status },
    });
  }
}
