import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(companyId: string, identifier: string, password: string) {
    const user = await this.usersService.findByIdentifier(companyId, identifier);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User is inactive');
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(companyId: string, identifier: string, password: string) {
    const user = await this.validateUser(companyId, identifier, password);

    await this.usersService.updateLastLogin(user.id);

    const payload = {
      sub: user.id,
      companyId: user.companyId,
      roleId: user.roleId,
      username: user.username,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Authentication successful',
      access_token: accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        status: user.status,
        companyId: user.companyId,
        roleId: user.roleId,
      },
    };
  }
}
