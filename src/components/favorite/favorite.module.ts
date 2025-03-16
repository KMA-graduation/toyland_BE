import { Module } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { FavoriteController } from './favorite.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoriteEntity } from '@entities/favorite.entity';
import { ProductEntity } from '@entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FavoriteEntity, ProductEntity])],
  controllers: [FavoriteController],
  providers: [FavoriteService],
})
export class FavoriteModule {}
