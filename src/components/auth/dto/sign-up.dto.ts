import { Transform } from 'class-transformer';
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
import { GenderEnum } from '../auth.constant';

export class SignUpDto {
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

  @IsDateString()
  @IsOptional()
  birth?: Date;

  @IsOptional()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  readonly role: number;

  @IsOptional()
  file?: any;
}
