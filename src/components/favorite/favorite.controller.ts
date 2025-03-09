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
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { UpdateFavoriteDto } from './dto/update-favorite.dto';
import { ListFavoriteQuery } from './dto/list-favorite-query.dto';
import { Auth } from '@decorators/auth.decorator';
import { AuthType } from '@enums/auth.enum';
import { Roles } from '@decorators/roles.decorator';
import { RoleEnum } from '@enums/role.enum';
import { FavoriteService } from './favorite.service';

@Controller('favorites')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  // @Roles(RoleEnum.ADMIN)
  @Post()
  create(@Body() request: CreateFavoriteDto) {
    return this.favoriteService.create(request);
  }

  @Get()
  @Auth(AuthType.Public)
  findAll(@Query() request: ListFavoriteQuery) {
    return this.favoriteService.findAll(request);
  }

  @Get('/:id')
  @Auth(AuthType.Public)
  findOne(@Param('id') id: number) {
    return this.favoriteService.findOne(id);
  }

  @Roles(RoleEnum.ADMIN)
  @Patch('/:id')
  update(@Param('id') id: number, @Body() request: UpdateFavoriteDto) {
    return this.favoriteService.update(id, request);
  }

  @Roles(RoleEnum.ADMIN)
  @Delete('/:id')
  remove(@Param('id') id: number) {
    return this.favoriteService.remove(id);
  }
}
