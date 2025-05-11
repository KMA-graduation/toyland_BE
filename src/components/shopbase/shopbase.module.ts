import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from '@entities/product.entity';
import { ProductImageEntity } from '@entities/product-image.entity';
import { HttpModule } from '@nestjs/axios';
import { ShopBaseController } from './shopbase.controller';
import { ShopBaseService } from './shopbase.service';
import { UserEntity } from '@entities/user.entity';
import { OrderDetailEntity } from '@entities/order-detail.entity';
import { OrderEntity } from '@entities/order.entity';

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
  controllers: [ShopBaseController],
  providers: [ShopBaseService],
  exports: [ShopBaseService],
})
export class ShopBaseModule {}
