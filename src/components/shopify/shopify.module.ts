import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from '@entities/product.entity';
import { ProductImageEntity } from '@entities/product-image.entity';
import { ShopifyController } from './shopify.controller';
import { ShopifyService } from './shopify.service';
import { HttpModule } from '@nestjs/axios';
import { UserEntity } from '@entities/user.entity';
import { OrderEntity } from '@entities/order.entity';
import { OrderDetailEntity } from '@entities/order-detail.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductEntity,
      ProductImageEntity,
      UserEntity,
      OrderDetailEntity,
      OrderEntity,
    ]),
    HttpModule,
  ],
  controllers: [ShopifyController],
  providers: [ShopifyService],
})
export class ShopifyModule {}
