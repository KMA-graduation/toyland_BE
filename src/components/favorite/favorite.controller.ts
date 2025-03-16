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
import { FavoriteService } from './favorite.service';
import { AuthUser } from '@decorators/user.decorator';
import { UserEntity } from '@entities/user.entity';
import { AddLikeRequestDto } from './dto/add-like.request.dto';
import { GetLikeRequestDto } from './dto/get-like.request.dto';
import { AddRateRequestDto } from './dto/add-rate.request.dto';
import { GetRateRequestDto } from './dto/get-rate.request.dto';

@Controller('favorites')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post('like')
  addLike(@Body() request: AddLikeRequestDto, @AuthUser() user: UserEntity) {
    return this.favoriteService.addLike(request, user);
  }

  @Get('like')
  getLike(@Query() request: GetLikeRequestDto, @AuthUser() user: UserEntity) {
    return this.favoriteService.getLike(request, user);
  }

  @Post('rate')
  addRate(@Body() request: AddRateRequestDto, @AuthUser() user: UserEntity) {
    return this.favoriteService.addRate(request, user);
  }

  @Get('rate')
  getRate(@Query() request: GetRateRequestDto, @AuthUser() user: UserEntity) {
    return this.favoriteService.getRate(request, user);
  }
}
