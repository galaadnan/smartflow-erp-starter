import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Company UUID — scopes the login to a specific tenant' })
  @IsUUID()
  companyId: string;

  @ApiProperty({ description: 'Username or email address' })
  @IsString()
  @MinLength(3)
  identifier: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
