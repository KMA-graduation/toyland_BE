import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from '@entities/product.entity';
import { CategoryEntity } from '@entities/category.entity';
import { BranchEntity } from '@entities/branch.entity';
import { ProductImageEntity } from '@entities/product-image.entity';
import { CloudinaryService } from '@components/cloudinary/cloudinary.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductEntity,
      ProductImageEntity,
      CategoryEntity,
      BranchEntity,
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService, CloudinaryService],
})
export class ProductModule {}
