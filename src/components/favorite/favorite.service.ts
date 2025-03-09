import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { UpdateFavoriteDto } from './dto/update-favorite.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { FavoriteEntity } from '@entities/favorite.entity';
import { Repository } from 'typeorm';
import { ResponseBuilder } from '@utils/response-builder';
import { ResponseCodeEnum } from '@enums/response-code.enum';
import { ResponseMessageEnum } from '@enums/response-message.enum';
import { ListFavoriteQuery } from './dto/list-favorite-query.dto';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectRepository(FavoriteEntity)
    private readonly favoriteRepository: Repository<FavoriteEntity>,
  ) {}

  async create(request: CreateFavoriteDto) {
    const favorite = new FavoriteEntity();
    favorite.userId = request.userId;
    favorite.productId = request.productId;
    favorite.rate = request.rate;
    favorite.like = request.like;
    const result = await this.favoriteRepository.save(favorite);

    return new ResponseBuilder(result)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.CREATE_SUCCESS)
      .build();
  }

  async findAll(request: ListFavoriteQuery) {
    const { page, take, skip } = request;
    const [favorites, number] = await this.favoriteRepository.findAndCount({
      take,
      skip,
    });

    const pages = Math.ceil(number / take) || 1;

    const result = {
      favorites,
      total: number,
      page,
      pages,
      limit: take,
    };

    return new ResponseBuilder()
      .withData(result)
      .withCode(ResponseCodeEnum.SUCCESS)
      .build();
  }

  async findOne(id: number) {
    const favorite = await this.getFavoriteExist(id);
    if (!favorite) throw new NotFoundException(ResponseMessageEnum.NOT_FOUND);

    return new ResponseBuilder()
      .withData(favorite)
      .withCode(ResponseCodeEnum.SUCCESS)
      .build();
  }

  async update(id: number, request: UpdateFavoriteDto) {
    const favorite = await this.getFavoriteExist(id);
    if (!favorite) throw new NotFoundException(ResponseMessageEnum.NOT_FOUND);

    for (const key in request) {
      if (key !== 'id') favorite[key] = request[key];
    }
    const result = await this.favoriteRepository.save(favorite);
    return new ResponseBuilder()
      .withData(result)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.UPDATE_SUCCESS)
      .build();
  }

  async remove(id: number) {
    const favorite = await this.getFavoriteExist(id);
    if (!favorite) throw new NotFoundException(ResponseMessageEnum.NOT_FOUND);

    await this.favoriteRepository.delete(id);

    return new ResponseBuilder()
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.DELETE_SUCCESS)
      .build();
  }

  private async getFavoriteExist(id: number) {
    return this.favoriteRepository.findOne({
      where: {
        id,
      },
    });
  }
}
