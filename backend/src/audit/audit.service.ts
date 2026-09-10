import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditQueryDto } from './dto/audit-query.dto';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, query: AuditQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };

    if (query.userId) where.userId = query.userId;
    if (query.entity) where.entity = { contains: query.entity, mode: 'insensitive' };
    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {
        ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
        ...(query.dateTo && { lte: new Date(query.dateTo) }),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async log(params: {
    companyId: string;
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    beforeJson?: Prisma.InputJsonValue;
    afterJson?: Prisma.InputJsonValue;
    ipAddress?: string;
  }) {
    return this.prisma.auditLog.create({ data: params });
  }
}
