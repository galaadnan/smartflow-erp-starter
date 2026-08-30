import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

const USER_SELECT = {
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
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findAll(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId },
      select: USER_SELECT,
    });
  }

  findByIdentifier(companyId: string, identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        companyId,
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

  async create(companyId: string, dto: CreateUserDto) {
    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
      select: { companyId: true },
    });

    if (!role || role.companyId !== companyId) {
      throw new BadRequestException('Role does not belong to your company');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        companyId,
        roleId: dto.roleId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        username: dto.username,
        passwordHash,
      },
      select: USER_SELECT,
    });
  }

  updateLastLogin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
}
