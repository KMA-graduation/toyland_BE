import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryEntity } from '@entities/category.entity';
import { Repository } from 'typeorm';
import { ResponseBuilder } from '@utils/response-builder';
import { ResponseCodeEnum } from '@enums/response-code.enum';
import { ResponseMessageEnum } from '@enums/response-message.enum';
import { ListCategoryQuery } from './dto/list-category-query.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async create(request: CreateCategoryDto) {
    const category = new CategoryEntity();
    category.name = request.name;
    category.description = request.description;
    //@TODO thumb
    const result = await this.categoryRepository.save(category);

    return new ResponseBuilder()
      .withData(result)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.CREATE_SUCCESS)
      .build();
  }

  async findAll(request: ListCategoryQuery) {
    const { page, take, skip } = request;
    const [categories, number] = await this.categoryRepository.findAndCount({
      take,
      skip,
    });

    const pages = Math.ceil(number / take) || 1;

    const result = {
      categories,
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
    const category = await this.getCategoryExist(id);
    if (!category) throw new NotFoundException(ResponseMessageEnum.NOT_FOUND);

    return new ResponseBuilder()
      .withData(category)
      .withCode(ResponseCodeEnum.SUCCESS)
      .build();
  }

  async update(id: number, request: UpdateCategoryDto) {
    const category = await this.getCategoryExist(id);
    if (!category) throw new NotFoundException(ResponseMessageEnum.NOT_FOUND);

    for (const key in request) {
      if (key !== 'id') category[key] = request[key];
    }
    const result = await this.categoryRepository.save(category);
    return new ResponseBuilder()
      .withData(result)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.UPDATE_SUCCESS)
      .build();
  }

  async remove(id: number) {
    const category = await this.getCategoryExist(id);
    if (!category) throw new NotFoundException(ResponseMessageEnum.NOT_FOUND);

    await this.categoryRepository.delete(id);

    return new ResponseBuilder()
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.DELETE_SUCCESS)
      .build();
  }

  private async getCategoryExist(id: number) {
    return this.categoryRepository.findOne({
      where: {
        id,
      },
    });
  }
}
