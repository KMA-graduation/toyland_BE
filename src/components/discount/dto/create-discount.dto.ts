import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDiscountDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  percent: number = 0;

  @IsNumber()
  @IsOptional()
  price: number = 0;

  @IsNumber()
  @IsOptional()
  quantity: number = 0;

  @IsNumber()
  @IsOptional()
  actualQuantity: number = 0;

  @IsString()
  @IsOptional()
  isActive: boolean;
}
