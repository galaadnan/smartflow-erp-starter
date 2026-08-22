import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findAll() {
    return this.prisma.user.findMany({
      include: {
        role: true,
        company: true,
      },
    });
  }

  create(data: {
    companyId: string;
    roleId: string;
    firstName: string;
    lastName?: string;
    email: string;
    username: string;
    passwordHash: string;
  }) {
    return this.prisma.user.create({
      data,
    });
  }
}
