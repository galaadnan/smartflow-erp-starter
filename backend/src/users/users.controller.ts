import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
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
