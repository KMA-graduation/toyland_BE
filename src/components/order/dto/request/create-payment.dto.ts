import { BankCodeEnum } from '@components/order/order.constant';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsOptional()
  orderId: number;

  @IsNotEmpty()
  @IsString()
  @IsEnum(BankCodeEnum)
  bankCode: BankCodeEnum = BankCodeEnum.VNBANK;

  @IsOptional()
  @IsString()
  locale = 'vn';

  @IsString()
  @IsOptional()
  discountCode: string;

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
