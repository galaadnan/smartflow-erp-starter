import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'Role ID to assign — must belong to the same company' })
  @IsUUID()
  roleId: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 3 })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ minLength: 8, description: 'Plain-text password — hashed server-side' })
  @IsString()
  @MinLength(8)
  password: string;
}
