import { Module } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { FavoriteController } from './favorite.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoriteEntity } from '@entities/favorite.entity';
import { ProductEntity } from '@entities/product.entity';
import { ProductImageEntity } from '@entities/product-image.entity';
import { OrderDetailEntity } from '@entities/order-detail.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FavoriteEntity, ProductEntity, ProductImageEntity, OrderDetailEntity])],
  controllers: [FavoriteController],
  providers: [FavoriteService],
})
export class FavoriteModule {}
