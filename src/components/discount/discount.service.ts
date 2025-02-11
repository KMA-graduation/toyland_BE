import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { PaginationQuery } from '@utils/pagination.query';
import { InjectRepository } from '@nestjs/typeorm';
import { DiscountEntity } from '@entities/discount.entity';
import { Repository } from 'typeorm';
import { ResponseBuilder } from '@utils/response-builder';
import { ResponseCodeEnum } from '@enums/response-code.enum';
import { ResponseMessageEnum } from '@enums/response-message.enum';

@Injectable()
export class DiscountService {
  constructor(
    @InjectRepository(DiscountEntity)
    private readonly discountRepository: Repository<DiscountEntity>,
  ) {}
  async create(request: CreateDiscountDto) {
    const discount = new DiscountEntity();
    discount.name = request.name;
    discount.percent = request.percent;
    discount.price = request.price;
    discount.quantity = request.quantity;
    discount.actualQuantity = request.actualQuantity;
    discount.isActive = request.isActive;

    const result = await this.discountRepository.save(discount);

    return new ResponseBuilder()
      .withData(result)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.CREATE_SUCCESS)
      .build();
  }

  async findAll(request: PaginationQuery) {
    const { page, take, skip } = request;
    const [discounts, number] = await this.discountRepository.findAndCount({
      take,
      skip,
    });

    const pages = Math.ceil(number / take) || 1;

    const result = {
      discounts,
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
    const discount = await this.getDiscountById(id);
    if (!discount) throw new NotFoundException(ResponseMessageEnum.NOT_FOUND);

    return new ResponseBuilder()
      .withData(discount)
      .withCode(ResponseCodeEnum.SUCCESS)
      .build();
  }

  async update(id: number, request: UpdateDiscountDto) {
    const discount = await this.getDiscountById(id);
    if (!discount) throw new NotFoundException(ResponseMessageEnum.NOT_FOUND);

    for (const key in request) {
      if (key !== 'id') discount[key] = request[key];
    }
    const result = await this.discountRepository.save(discount);
    return new ResponseBuilder()
      .withData(result)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.UPDATE_SUCCESS)
      .build();
  }

  async remove(id: number) {
    const discount = await this.getDiscountById(id);
    if (!discount) throw new NotFoundException(ResponseMessageEnum.NOT_FOUND);

    await this.discountRepository.delete(id);

    return new ResponseBuilder()
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.DELETE_SUCCESS)
      .build();
  }

  private async getDiscountById(id: number) {
    return this.discountRepository.findOne({
      where: {
        id,
      },
    });
  }
}
