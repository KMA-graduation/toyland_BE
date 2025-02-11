import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProductDto {
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  categoryId: number;

  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  branchId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  price: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  salePrice: number;

  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  stockAmount: number;

  @IsString()
  @IsNotEmpty()
  type: string; // clothing/shoes

  @IsOptional()
  files: any;
}
