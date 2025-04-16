/* eslint-disable prettier/prettier */
import { Expose, Type } from 'class-transformer';

class RevenueByMonthOfYear {
 @Expose()
 label: string;

  @Expose()
  totalPrice: number;
}

class Product {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  price: string;

  @Expose()
  stockAmount: string;

  @Expose()
  totalAmount: number;
}

export class RevenueResponseDto {
  @Expose()
  revenue: number;

  @Expose()
  @Type(() => RevenueByMonthOfYear)
  revenueByMonthOfYear: RevenueByMonthOfYear[];

  @Expose()
  @Type(() => Product)
  producs: Product[];
}
