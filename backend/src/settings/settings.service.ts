import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(companyId: string) {
    let settings = await this.prisma.companySettings.findUnique({
      where: { companyId },
    });

    if (!settings) {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });
      if (!company) throw new NotFoundException('Company not found');

      settings = await this.prisma.companySettings.create({
        data: {
          companyId,
          companyName: company.name,
          currency: company.currency,
          timezone: company.timezone,
        },
      });
    }

    return settings;
  }

  async update(companyId: string, dto: UpdateSettingsDto) {
    await this.findOne(companyId);
    return this.prisma.companySettings.update({
      where: { companyId },
      data: dto,
    });
  }
}
