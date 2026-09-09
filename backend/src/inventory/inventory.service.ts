import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InventoryTransactionType } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
import { InventoryQueryDto } from './dto/inventory-query.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, query: InventoryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };

    if (query.type) {
      where.type = query.type;
    }

    if (query.search) {
      where.product = {
        name: { contains: query.search, mode: 'insensitive' },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, sku: true, name: true } },
        },
      }),
      this.prisma.inventoryTransaction.count({ where }),
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

  async findByProduct(companyId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId },
    });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.inventoryTransaction.findMany({
      where: { companyId, productId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, sku: true, name: true } },
      },
    });
  }

  async getStock(companyId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId },
      select: { id: true, sku: true, name: true, stockQty: true, reorderLevel: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return {
      product,
      stock: product.stockQty,
      lowStock: product.stockQty <= product.reorderLevel,
    };
  }

  async create(companyId: string, dto: CreateInventoryTransactionDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, companyId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const delta = this.computeDelta(dto.type, dto.quantity);
    const newStock = product.stockQty + delta;

    if (newStock < 0) {
      throw new BadRequestException(
        `Insufficient stock. Current: ${product.stockQty}, requested OUT: ${dto.quantity}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.inventoryTransaction.create({
        data: {
          companyId,
          productId: dto.productId,
          type: dto.type,
          quantity: dto.quantity,
          reference: dto.reference,
          notes: dto.notes,
        },
        include: {
          product: { select: { id: true, sku: true, name: true } },
        },
      });

      await tx.product.update({
        where: { id: dto.productId },
        data: { stockQty: newStock },
      });

      return transaction;
    });
  }

  private computeDelta(type: InventoryTransactionType, quantity: number): number {
    switch (type) {
      case InventoryTransactionType.IN:
      case InventoryTransactionType.RETURN:
        return quantity;
      case InventoryTransactionType.OUT:
        return -quantity;
      case InventoryTransactionType.ADJUSTMENT:
        return quantity;
    }
  }
}
