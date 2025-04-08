import { GenderEnum } from '@components/auth/auth.constant';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  readonly username: string;

  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsString()
  @MaxLength(20)
  @MinLength(6)
  @IsNotEmpty()
  readonly password: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(GenderEnum)
  readonly gender: string;

  @IsString()
  @IsOptional()
  readonly address?: string;

  @IsString()
  @IsOptional()
  readonly phoneNumber?: string;

  @IsDateString()
  @IsOptional()
  birth?: Date;

  @IsString()
  @IsOptional()
  readonly role: number;

  @IsOptional()
  file?: any;
}
