/* eslint-disable prettier/prettier */
import { Expose, Type } from 'class-transformer';

class RevenueByMonthOfYear {
 @Expose()
 label: string;

  @Expose()
  totalPrice: number;
}

class Category {
  @Expose()
  id: number;

  @Expose()
  name: string;
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

  @Expose()
  sold: number;

  @Expose()
  shopifyId: number;

  @Expose()
  shopBaseId: number;

  @Expose()
  @Type(() => Category)
  category: Category;
}

export class RevenueResponseDto {
  @Expose()
  totalLocalShopPrice: number;
  
  @Expose()
  totalShopifyPrice: number;
  
  @Expose()
  totalShopbasePrice: number;

  @Expose()
  totalOrder

  @Expose()
  totalOrderShopify

  @Expose()
  totalOrderShopbase
  
  @Expose()
  totalOrderLocalShop
  
  @Expose()
  revenue: number;

  @Expose()
  @Type(() => RevenueByMonthOfYear)
  revenueByMonthOfYear: RevenueByMonthOfYear[];

  @Expose()
  @Type(() => Product)
  producs: Product[];

  @Expose()
  categoryRevenue: {
    categoryId: number;
    categoryName: string;
    totalRevenue: number;
  }[];
}
