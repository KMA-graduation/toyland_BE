/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/request/create-user.request';
import { ListUserQuery } from './dto/query/list-user.query';
import { UpdateUserRequest } from './dto/request/update-user.request';
import { RoleEnum } from '@enums/role.enum';
import { Roles } from '@decorators/roles.decorator';

@Controller('users')
@Roles(RoleEnum.ADMIN)
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  create(@Body() request: CreateUserDto) {
    return this.userService.create(request);
  }

  @Get()
  findAll(@Query() request: ListUserQuery) {
    return this.userService.findAll(request);
  }

  @Get('/:id')
  findOne(@Param('id') id: number) {
    return this.userService.findOne(id);
  }

  @Patch('/:id')
  update(@Param('id') id: number, @Body() updateUserDto: UpdateUserRequest) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete('/:id')
  remove(@Param('id') id: number) {
    return this.userService.remove(id);
  }

  @Put('/:id/change-status')
  changeStatus(@Param('id') id: number) {
    return this.userService.changeStatus(id);
  }
}
