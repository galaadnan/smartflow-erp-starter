import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        companyId: true,
        roleId: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        company: true,
      },
    });
  }

  findByIdentifier(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
        ],
      },
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
