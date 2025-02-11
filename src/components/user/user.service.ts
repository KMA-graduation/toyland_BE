/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/request/create-user.request';
import { UserEntity } from '@entities/user.entity';
import { Repository } from 'typeorm';
import { ListUserQuery } from './dto/query/list-user.query';
import { plainToClass } from 'class-transformer';
import { UserResponse } from './dto/response/user.response';
import { UpdateUserRequest } from './dto/request/update-user.request';
import { ResponseMessageEnum } from '@enums/response-message.enum';
import { ResponseBuilder } from '@utils/response-builder';
import { ResponseCodeEnum } from '@enums/response-code.enum';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(request: CreateUserDto) {
    await this.checkEmailExist(request.email);
    const salt = bcrypt.genSaltSync(10);
    const password = bcrypt.hashSync(request.password, salt);
    const user = await this.userRepository.save({ ...request, password });

    const resUser = plainToClass(UserResponse, user, {
      excludeExtraneousValues: true,
    });

    return new ResponseBuilder()
      .withData(resUser)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.CREATE_SUCCESS)
      .build();
  }

  async findAll(request: ListUserQuery) {
    const { page, take, skip } = request;

    const [users, number] = await this.userRepository.findAndCount({
      take,
      skip,
      order: {
        id: 'DESC',
      },
    });

    const pages = Math.ceil(number / take) || 1;

    const resUser = plainToClass(UserResponse, users, {
      excludeExtraneousValues: true,
    });

    const result = {
      users: resUser,
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
    const user = await this.getUserExist(id);
    if (!user) throw new NotFoundException(ResponseMessageEnum.INVALID_USER);

    const resUser = plainToClass(UserResponse, user, {
      excludeExtraneousValues: true,
    });

    return new ResponseBuilder()
      .withData(resUser)
      .withCode(ResponseCodeEnum.SUCCESS)
      .build();
  }

  async update(id: number, request: UpdateUserRequest) {
    const user = await this.getUserExist(id);
    if (!user) throw new NotFoundException(ResponseMessageEnum.INVALID_USER);

    for (const key in request) {
      if (key !== 'id') user[key] = request[key];
    }
    const result = await this.userRepository.save(user);
    return new ResponseBuilder()
      .withData(result)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.UPDATE_SUCCESS)
      .build();
  }

  async remove(id: number) {
    const user = await this.getUserExist(id);
    if (!user) throw new NotFoundException(ResponseMessageEnum.INVALID_USER);

    await this.userRepository.delete(id);

    return new ResponseBuilder()
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.DELETE_SUCCESS)
      .build();
  }

  async changeStatus(id: number) {
    const user = await this.getUserExist(id);
    if (!user) throw new NotFoundException(ResponseMessageEnum.INVALID_USER);

    const isActive = user.isActive === true ? false : true;
    const newUser = {
      ...user,
      isActive,
    };

    await this.userRepository.save(newUser);

    return new ResponseBuilder()
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.UPDATE_SUCCESS)
      .build();
  }

  async checkEmailExist(email: string) {
    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });
    if (user) throw new BadRequestException(ResponseMessageEnum.EMAIL_EXISTS);

    return user;
  }

  async getUserExist(id: number) {
    return this.userRepository.findOne({
      where: {
        id,
      },
    });
  }
}
