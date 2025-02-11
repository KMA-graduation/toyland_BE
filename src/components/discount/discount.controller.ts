import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { DiscountService } from './discount.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { PaginationQuery } from '@utils/pagination.query';
import { Roles } from '@decorators/roles.decorator';
import { RoleEnum } from '@enums/role.enum';

@Controller('discounts')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Roles(RoleEnum.ADMIN)
  @Post()
  create(@Body() request: CreateDiscountDto) {
    return this.discountService.create(request);
  }

  @Get()
  findAll(@Query() request: PaginationQuery) {
    return this.discountService.findAll(request);
  }

  @Get('/:id')
  findOne(@Param('id') id: number) {
    return this.discountService.findOne(id);
  }

  @Roles(RoleEnum.ADMIN)
  @Patch('/:id')
  update(@Param('id') id: number, @Body() request: UpdateDiscountDto) {
    return this.discountService.update(id, request);
  }

  @Roles(RoleEnum.ADMIN)
  @Delete('/:id')
  remove(@Param('id') id: number) {
    return this.discountService.remove(id);
  }
}
