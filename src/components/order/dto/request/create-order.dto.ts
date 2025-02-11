import { OrderStatus } from '@components/order/order.constant';
import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class OrderDetailRequest {
  @IsInt()
  @Transform(({ value }) => Number(value))
  @IsNotEmpty()
  id: number;

  @IsInt()
  @Min(1)
  @Transform(({ value }) => Number(value))
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  size: string;

  @IsInt()
  @Min(1)
  @Transform(({ value }) => Number(value))
  @IsOptional()
  unitPrice: number;

  @IsString()
  @IsEnum(OrderStatus)
  status: string = OrderStatus.IN_CART;
}

export class CreateOrderDto {
  @Type(() => OrderDetailRequest)
  @ValidateNested({
    each: true,
  })
  @ArrayUnique<OrderDetailRequest>((product) => product.id)
  @ArrayNotEmpty()
  products: OrderDetailRequest[];
}
