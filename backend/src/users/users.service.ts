import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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
  role: {
    select: {
      id: true,
      name: true,
      description: true,
    },
  },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId },
      select: USER_SELECT,
    });
  }

  async findOne(companyId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  findByIdentifier(companyId: string, identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        companyId,
        OR: [{ email: identifier }, { username: identifier }],
      },
      include: {
        role: true,
        company: true,
      },
    });
  }

  async create(companyId: string, dto: CreateUserDto) {
    await this.assertRoleBelongsToCompany(dto.roleId, companyId);
    await this.assertNoDuplicateEmail(companyId, dto.email);
    await this.assertNoDuplicateUsername(companyId, dto.username);

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

  async update(companyId: string, id: string, dto: UpdateUserDto) {
    await this.findOne(companyId, id);

    if (dto.roleId) {
      await this.assertRoleBelongsToCompany(dto.roleId, companyId);
    }

    if (dto.email) {
      await this.assertNoDuplicateEmail(companyId, dto.email, id);
    }

    if (dto.username) {
      await this.assertNoDuplicateUsername(companyId, dto.username, id);
    }

    const data: Record<string, unknown> = {};
    if (dto.roleId !== undefined) data.roleId = dto.roleId;
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.username !== undefined) data.username = dto.username;
    if (dto.password !== undefined) {
      data.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
  }

  async setStatus(companyId: string, id: string, status: 'ACTIVE' | 'INACTIVE') {
    await this.findOne(companyId, id);
    return this.prisma.user.update({
      where: { id },
      data: { status },
      select: USER_SELECT,
    });
  }

  updateLastLogin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  private async assertRoleBelongsToCompany(roleId: string, companyId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { companyId: true },
    });
    if (!role || role.companyId !== companyId) {
      throw new BadRequestException('Role does not belong to your company');
    }
  }

  private async assertNoDuplicateEmail(companyId: string, email: string, excludeId?: string) {
    const existing = await this.prisma.user.findFirst({
      where: {
        companyId,
        email,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (existing) throw new ConflictException('Email is already in use');
  }

  private async assertNoDuplicateUsername(companyId: string, username: string, excludeId?: string) {
    const existing = await this.prisma.user.findFirst({
      where: {
        companyId,
        username,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (existing) throw new ConflictException('Username is already in use');
  }
}
