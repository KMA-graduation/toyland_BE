import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';

import { FavoriteEntity } from '@entities/favorite.entity';
import { ProductEntity } from '@entities/product.entity';
import { UserEntity } from '@entities/user.entity';
import { ResponseCodeEnum } from '@enums/response-code.enum';
import { ResponseMessageEnum } from '@enums/response-message.enum';
import { ResponseBuilder } from '@utils/response-builder';
import { AddLikeRequestDto } from './dto/add-like.request.dto';
import { GetLikeRequestDto } from './dto/get-like.request.dto';
import { AddRateRequestDto } from './dto/add-rate.request.dto';
import { GetRateRequestDto } from './dto/get-rate.request.dto';
import { groupBy, isEmpty, keyBy, sumBy } from 'lodash';
import { ProductImageEntity } from '@entities/product-image.entity';
import { OrderDetailEntity } from '@entities/order-detail.entity';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectRepository(FavoriteEntity)
    private readonly favoriteRepository: Repository<FavoriteEntity>,

    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,

    @InjectRepository(ProductImageEntity)
    private readonly productImageRepository: Repository<ProductImageEntity>,

    @InjectRepository(OrderDetailEntity)
    private readonly orderDetailRepository: Repository<OrderDetailEntity>,
  ) {}

  async addLike(request: AddLikeRequestDto, user: UserEntity) {
    try {
      const { productId } = request;

      const product = await this.productRepository.findOne({
        where: { id: productId },
      });
      console.log('🚀 [LOGGER] product:', product);

      if (!product) {
        return new ResponseBuilder()
          .withCode(ResponseCodeEnum.NOT_FOUND)
          .withMessage(ResponseMessageEnum.PRODUCT_NOT_FOUND)
          .build();
      }

      const favorite = await this.favoriteRepository.findOne({
        where: { productId, userId: user.id },
      });

      if (!favorite) {
        const favoriteEntity = new FavoriteEntity();
        favoriteEntity.productId = productId;
        favoriteEntity.userId = user.id;
        favoriteEntity.isLike = true;

        await this.favoriteRepository.save(favoriteEntity);
      } else {
        favorite.isLike = !favorite.isLike;
        await this.favoriteRepository.save(favorite);
      }

      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.SUCCESS)
        .withMessage(ResponseMessageEnum.CREATE_SUCCESS)
        .build();
    } catch (error) {
      console.log('🚀 [LOGGER] error:', error);
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.SUCCESS)
        .withMessage(ResponseMessageEnum.SERVER_ERROR)
        .build();
    }
  }

  async getLike(request: GetLikeRequestDto, user: UserEntity) {
    try {
      const { productId, isGetAll, page, take, skip } = request;

      // let favorites;
      // let total;

      const condition = {
        userId: user.id,
        isLike: true,
      };

      if (productId) {
        condition['productId'] = productId;
      }

      const [data, count] = await this.favoriteRepository.findAndCount({
        where: condition,
        ...(isGetAll ? {} : { take, skip }),
      });

      const productIds = data.map((item) => item.productId);
      const [products, productDetails] = await Promise.all([
        this.productRepository.findBy({ id: In(productIds) }),
        this.productImageRepository.findBy({ productId: In(productIds) }),
      ]);
      const productMap = keyBy(products, 'id');
      const productImageMap = groupBy(productDetails, 'productId');

      data.forEach((item) => {
        const product = productMap[item.productId];
        product['images'] = productImageMap[item.productId] || [];
        item['product'] = product;
      });

      const total = count;
      const favorites = data;

      const pages = Math.ceil(total / take) || 1;

      const result = {
        favorites,
        total,
        page,
        pages,
        limit: take,
      };

      return new ResponseBuilder(result)
        .withCode(ResponseCodeEnum.SUCCESS)
        .withMessage(ResponseMessageEnum.CREATE_SUCCESS)
        .build();
    } catch (error) {
      console.log('🚀 [LOGGER] error:', error);
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.SUCCESS)
        .withMessage(ResponseMessageEnum.SERVER_ERROR)
        .build();
    }
  }

  async addRate(request: AddRateRequestDto, user: UserEntity) {
    try {
      const { productId, rate, orderId } = request;
  
      const product = await this.validateProduct(productId);
      if (!product) return this.buildResponse(ResponseCodeEnum.NOT_FOUND, ResponseMessageEnum.PRODUCT_NOT_FOUND);
  
      await this.upsertFavorite(productId, user.id, rate);
  
      const orderDetail = await this.validateOrderDetail(orderId, productId);
      if (!orderDetail) return this.buildResponse(ResponseCodeEnum.NOT_FOUND, ResponseMessageEnum.ORDER_DETAIL_NOT_FOUND);
  
      orderDetail.isRating = true;
      await this.orderDetailRepository.save(orderDetail);
  
      return this.buildResponse(ResponseCodeEnum.SUCCESS, ResponseMessageEnum.CREATE_SUCCESS);
    } catch (error) {
      console.error('[ADD_RATE][ERROR]:', error);
      return this.buildResponse(ResponseCodeEnum.SERVER_ERROR, ResponseMessageEnum.SERVER_ERROR);
    }
  }

  async getRate(request: GetRateRequestDto, user: UserEntity) {
    try {
      const { productId, isGetAll, page, take, skip } = request;

      let favorites;
      let total;
      let totalAvg;

      const condition = {
        userId: user.id,
        rate: Not(IsNull()),
      };

      if (productId) {
        condition['productId'] = productId;
      }

      if (isGetAll) {
        const [data, count] = await this.favoriteRepository.findAndCount({
          where: condition,
        });

        favorites = data;
        total = count;
      } else {
        const [data, count] = await this.favoriteRepository.findAndCount({
          where: condition,
          take,
          skip,
        });

        const allFav = await this.favoriteRepository.find({
          where: condition,
        });

        favorites = data;
        total = count;

        if (!isEmpty(allFav)) {
          const sumRate = sumBy(allFav, 'rate');
          totalAvg = sumRate / allFav.length;
        }
      }

      const pages = Math.ceil(total / take) || 1;

      const result = {
        favorites,
        total,
        totalAvg,
        page,
        pages,
        limit: take,
      };

      return new ResponseBuilder(result)
        .withCode(ResponseCodeEnum.SUCCESS)
        .withMessage(ResponseMessageEnum.CREATE_SUCCESS)
        .build();
    } catch (error) {
      console.log('🚀 [LOGGER] error:', error);
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.SUCCESS)
        .withMessage(ResponseMessageEnum.SERVER_ERROR)
        .build();
    }
  }

  private buildResponse(code: ResponseCodeEnum, message: ResponseMessageEnum) {
    return new ResponseBuilder().withCode(code).withMessage(message).build();
  }

  private async validateProduct(productId: number): Promise<ProductEntity | null> {
    return this.productRepository.findOne({ where: { id: productId } });
  }
  
  private async validateOrderDetail(orderId: number, productId: number): Promise<OrderDetailEntity | null> {
    return this.orderDetailRepository.findOne({ where: { orderId, productId } });
  }
  
  private async upsertFavorite(productId: number, userId: number, rate: number): Promise<void> {
    let favorite = await this.favoriteRepository.findOne({ where: { productId, userId } });
  
    if (!favorite) {
      favorite = this.favoriteRepository.create({ productId, userId, rate });
    } else {
      favorite.rate = rate;
    }
  
    await this.favoriteRepository.save(favorite);
  }
}
