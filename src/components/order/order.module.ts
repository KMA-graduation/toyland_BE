import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from '@entities/order.entity';
import { OrderDetailEntity } from '@entities/order-detail.entity';
import { ProductEntity } from '@entities/product.entity';
import { DiscountEntity } from '@entities/discount.entity';
import { ConfigModule } from '@nestjs/config';
import { ProductImageEntity } from '@entities/product-image.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      OrderDetailEntity,
      ProductEntity,
      ProductImageEntity,
      DiscountEntity,
    ]),
    ConfigModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
