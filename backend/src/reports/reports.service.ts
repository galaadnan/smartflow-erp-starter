import { Injectable } from '@nestjs/common';
import { InvoiceStatus, SalesOrderStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsQueryDto } from './dto/reports-query.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesReport(companyId: string, query: ReportsQueryDto) {
    const dateFilter = this.buildDateFilter(query);
    const where = { companyId, ...dateFilter };

    const [orders, confirmedOrders] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where,
        select: { totalAmount: true, status: true, createdAt: true },
      }),
      this.prisma.salesOrder.findMany({
        where: { ...where, status: SalesOrderStatus.CONFIRMED },
        select: { totalAmount: true },
      }),
    ]);

    const totalRevenue = confirmedOrders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0,
    );

    return {
      totalOrders: orders.length,
      confirmedOrders: confirmedOrders.length,
      totalRevenue: totalRevenue.toFixed(2),
      byStatus: this.groupByStatus(orders),
    };
  }

  async getInventoryReport(companyId: string) {
    const products = await this.prisma.product.findMany({
      where: { companyId },
      select: {
        id: true,
        sku: true,
        name: true,
        category: true,
        stockQty: true,
        reorderLevel: true,
        costPrice: true,
        status: true,
      },
      orderBy: { stockQty: 'asc' },
    });

    const lowStock = products.filter((p) => p.stockQty <= p.reorderLevel);
    const totalStockValue = products.reduce(
      (sum, p) => sum + Number(p.costPrice) * p.stockQty,
      0,
    );

    const movements = await this.prisma.inventoryTransaction.groupBy({
      by: ['type'],
      where: { companyId },
      _sum: { quantity: true },
    });

    return {
      totalProducts: products.length,
      lowStockProducts: lowStock.length,
      totalStockValue: totalStockValue.toFixed(2),
      lowStockItems: lowStock,
      movementSummary: movements,
    };
  }

  async getCustomerReport(companyId: string, query: ReportsQueryDto) {
    const dateFilter = this.buildDateFilter(query);

    const customers = await this.prisma.customer.findMany({
      where: { companyId },
      include: {
        salesOrders: {
          where: dateFilter,
          select: { totalAmount: true, status: true },
        },
        invoices: {
          where: { companyId, ...dateFilter },
          select: { total: true, balance: true, status: true },
        },
      },
    });

    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      status: c.status,
      totalOrders: c.salesOrders.length,
      totalPurchases: c.salesOrders
        .reduce((s, o) => s + Number(o.totalAmount), 0)
        .toFixed(2),
      outstandingBalance: c.invoices
        .filter((i) => i.status !== InvoiceStatus.PAID && i.status !== InvoiceStatus.CANCELLED)
        .reduce((s, i) => s + Number(i.balance), 0)
        .toFixed(2),
    }));
  }

  async getFinancialReport(companyId: string, query: ReportsQueryDto) {
    const dateFilter = this.buildDateFilter(query);

    const [invoices, payments] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { companyId, ...dateFilter },
        select: { total: true, paidAmount: true, balance: true, status: true },
      }),
      this.prisma.payment.findMany({
        where: { companyId, ...dateFilter },
        select: { amount: true, paymentMethod: true, status: true },
      }),
    ]);

    const totalInvoiced = invoices.reduce((s, i) => s + Number(i.total), 0);
    const totalCollected = invoices.reduce((s, i) => s + Number(i.paidAmount), 0);
    const totalOutstanding = invoices
      .filter((i) => i.status !== InvoiceStatus.PAID && i.status !== InvoiceStatus.CANCELLED)
      .reduce((s, i) => s + Number(i.balance), 0);

    const totalPayments = payments
      .filter((p) => p.status === 'COMPLETED')
      .reduce((s, p) => s + Number(p.amount), 0);

    return {
      totalInvoiced: totalInvoiced.toFixed(2),
      totalCollected: totalCollected.toFixed(2),
      totalOutstanding: totalOutstanding.toFixed(2),
      totalPayments: totalPayments.toFixed(2),
      invoiceCount: invoices.length,
      paidInvoices: invoices.filter((i) => i.status === InvoiceStatus.PAID).length,
      unpaidInvoices: invoices.filter((i) => i.status === InvoiceStatus.DRAFT || i.status === InvoiceStatus.SENT || i.status === InvoiceStatus.OVERDUE).length,
    };
  }

  private buildDateFilter(query: ReportsQueryDto) {
    if (!query.dateFrom && !query.dateTo) return {};
    return {
      createdAt: {
        ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
        ...(query.dateTo && { lte: new Date(query.dateTo) }),
      },
    };
  }

  private groupByStatus(orders: { status: string }[]) {
    return orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {});
  }
}
