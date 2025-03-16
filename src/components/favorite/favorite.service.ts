import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';

import { FavoriteEntity } from '@entities/favorite.entity';
import { ProductEntity } from '@entities/product.entity';
import { UserEntity } from '@entities/user.entity';
import { ResponseCodeEnum } from '@enums/response-code.enum';
import { ResponseMessageEnum } from '@enums/response-message.enum';
import { ResponseBuilder } from '@utils/response-builder';
import { AddLikeRequestDto } from './dto/add-like.request.dto';
import { PaginationQuery } from '@utils/pagination.query';
import { GetLikeRequestDto } from './dto/get-like.request.dto';
import { AddRateRequestDto } from './dto/add-rate.request.dto';
import { GetRateRequestDto } from './dto/get-rate.request.dto';
import { isEmpty, sumBy } from 'lodash';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectRepository(FavoriteEntity)
    private readonly favoriteRepository: Repository<FavoriteEntity>,

    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
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

      let favorites;
      let total;

      const condition = {
        userId: user.id,
        isLike: Not(IsNull()),
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

        favorites = data;
        total = count;
      }

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
      const { productId } = request;

      const product = await this.productRepository.findOne({
        where: { id: productId },
      });

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
        favoriteEntity.rate = request.rate;

        await this.favoriteRepository.save(favoriteEntity);
      } else {
        favorite.rate = request.rate;
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
}
