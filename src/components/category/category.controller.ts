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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ListCategoryQuery } from './dto/list-category-query.dto';
import { Auth } from '@decorators/auth.decorator';
import { AuthType } from '@enums/auth.enum';
import { Roles } from '@decorators/roles.decorator';
import { RoleEnum } from '@enums/role.enum';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // @Roles(RoleEnum.ADMIN)
  @Post()
  create(@Body() request: CreateCategoryDto) {
    return this.categoryService.create(request);
  }

  @Get()
  @Auth(AuthType.Public)
  findAll(@Query() request: ListCategoryQuery) {
    return this.categoryService.findAll(request);
  }

  @Get('/:id')
  @Auth(AuthType.Public)
  findOne(@Param('id') id: number) {
    return this.categoryService.findOne(id);
  }

  @Roles(RoleEnum.ADMIN)
  @Patch('/:id')
  update(@Param('id') id: number, @Body() request: UpdateCategoryDto) {
    return this.categoryService.update(id, request);
  }

  @Roles(RoleEnum.ADMIN)
  @Delete('/:id')
  remove(@Param('id') id: number) {
    return this.categoryService.remove(id);
  }
}
