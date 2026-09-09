import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { users: true } } },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, customers: true, products: true } },
        roles: { select: { id: true, name: true } },
      },
    });
    if (!company) throw new NotFoundException('Tenant not found');
    return company;
  }

  async create(dto: CreateTenantDto) {
    const existing = await this.prisma.company.findFirst({
      where: { email: dto.companyEmail },
    });
    if (existing) {
      throw new BadRequestException('A company with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.adminPassword, 10);

    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: dto.companyName,
          legalName: dto.legalName,
          email: dto.companyEmail,
          phone: dto.phone,
          country: dto.country ?? 'Saudi Arabia',
          currency: dto.currency ?? 'SAR',
        },
      });

      const adminRole = await tx.role.create({
        data: {
          companyId: company.id,
          name: 'Admin',
          description: 'Full access administrator',
        },
      });

      await tx.user.create({
        data: {
          companyId: company.id,
          roleId: adminRole.id,
          firstName: dto.adminFirstName,
          email: dto.adminEmail,
          username: dto.adminUsername,
          passwordHash,
        },
      });

      return { company, role: adminRole };
    });
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findOne(id);
    return this.prisma.company.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.company.delete({ where: { id } });
    return { message: 'Tenant deleted' };
  }
}
