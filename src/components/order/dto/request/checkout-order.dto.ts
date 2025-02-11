import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApplyDiscountDto } from './apply-discount.dto';

export class CheckoutOrderDto extends ApplyDiscountDto {
  @IsString()
  @IsNotEmpty()
  paymentType: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  receiver: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  note: string;
}
