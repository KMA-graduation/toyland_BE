import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from '@entities/product.entity';
import { ProductImageEntity } from '@entities/product-image.entity';
import { HttpModule } from '@nestjs/axios';
import { ShopBaseController } from './shopbase.controller';
import { ShopBaseService } from './shopbase.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity, ProductImageEntity]),
    HttpModule,
  ],
  controllers: [ShopBaseController],
  providers: [ShopBaseService],
})
export class ShopBaseModule {}
