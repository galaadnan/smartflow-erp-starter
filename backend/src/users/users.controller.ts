import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(
    @Body()
    data: {
      companyId: string;
      roleId: string;
      firstName: string;
      lastName?: string;
      email: string;
      username: string;
      passwordHash: string;
    },
  ) {
    return this.usersService.create(data);
  }
}
