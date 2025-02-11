import { IsMe, OrderStatus } from '@components/order/order.constant';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ChangeStatusOrder {
  @IsString()
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  status: string;

  @IsEnum(IsMe)
  @Transform(({ value }) => Number(value))
  @IsOptional()
  isMe: IsMe;
}
