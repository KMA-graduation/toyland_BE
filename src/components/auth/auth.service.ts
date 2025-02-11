import * as bcrypt from 'bcrypt';
import { isEmpty } from 'class-validator';
import { REQUEST } from '@nestjs/core';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { plainToClass, plainToInstance } from 'class-transformer';
import { InjectRepository } from '@nestjs/typeorm';

import { SignUpDto } from './dto/sign-up.dto';
import { SignTokenPayload } from './auth.interface';
import { SignInDto } from './dto/sign-in.dto';
import { Repository } from 'typeorm';
import { UserEntity } from '@entities/user.entity';
import { UserResponse } from '@components/user/dto/response/user.response';
import { ResponseMessageEnum } from '@enums/response-message.enum';
import { ApiError } from '@utils/api.error';
import { ResponseCodeEnum } from '@enums/response-code.enum';
import { ResponseBuilder } from '@utils/response-builder';
import { AuthResponseDto } from './dto/response/auth.response.dto';
import { MailService } from '@components/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @Inject(REQUEST) private request: any,

    private readonly configService: ConfigService,

    private readonly jwtService: JwtService,

    private readonly mailService: MailService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const { email, password, username, role = 0 } = signUpDto;

    const isExisted = await this.userRepository.findOne({
      where: {
        email,
      },
    });

    if (isExisted) {
      throw new BadRequestException(ResponseMessageEnum.EMAIL_EXISTS);
    }
    const saltOrRounds = 7;
    const hashPassword = await bcrypt.hash(password, saltOrRounds);

    const newUser = await this.userRepository.save({
      username,
      email,
      role: Number(role),
      password: hashPassword,
    });

    const userId = newUser.id;
    const payload = { userId };

    const [accessToken, refreshToken] = await Promise.all([
      this.generateToken(payload),
      this.generateToken(payload, true),
    ]);

    this.mailService.sendMail({
      email: [email],
      body: {
        subject: 'Đăng ký thành công',
        template: 'welcome',
        context: {
          email,
          url: process.env.BASE_URL || 'http://localhost:5173/',
        },
      },
    });

    const response = plainToInstance(
      AuthResponseDto,
      {
        user: newUser,
        accessToken,
        refreshToken,
      },
      {
        excludeExtraneousValues: true,
      },
    );

    return new ResponseBuilder()
      .withData(response)
      .withCode(ResponseCodeEnum.CREATED)
      .withMessage(ResponseMessageEnum.CREATE_SUCCESS)
      .build();
  }

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;

    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });

    if (!user.isActive) {
      throw new BadRequestException('Tài khoản của bạn đã bị khóa');
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new BadRequestException('Email hoặc mật khẩu không chính xác');
    }

    const userId = user.id;
    const payload = { userId };

    const [accessToken, refreshToken] = await Promise.all([
      this.generateToken(payload),
      this.generateToken(payload, true),
    ]);

    const response = plainToInstance(
      AuthResponseDto,
      {
        user,
        accessToken,
        refreshToken,
      },
      {
        excludeExtraneousValues: true,
      },
    );

    return new ResponseBuilder()
      .withData(response)
      .withCode(ResponseCodeEnum.CREATED)
      .withMessage(ResponseMessageEnum.CREATE_SUCCESS)
      .build();
  }

  async refreshToken(user: any) {
    const token = this.request.headers['authorization']?.split(' ')[1];
    try {
      const decoded = this.jwtService.decode(token);
      const { userId } = decoded as SignTokenPayload;

      const user = await this.userRepository.findOneBy({ id: userId });
      if (isEmpty(user)) {
        return new ApiError(
          ResponseCodeEnum.UNAUTHORIZED,
          ResponseMessageEnum.INVALID_USER,
        ).toResponse();
      }

      const payload = { userId };

      const [accessToken, refreshToken] = await Promise.all([
        this.generateToken(payload),
        this.generateToken(payload, true),
      ]);

      const data = {
        accessToken,
        refreshToken,
      };

      return new ResponseBuilder()
        .withData(data)
        .withCode(ResponseCodeEnum.CREATED)
        .withMessage(ResponseMessageEnum.CREATE_SUCCESS)
        .build();
    } catch (error) {
      if (error.constructor.name === 'TokenExpiredError') {
        return new ApiError(
          ResponseCodeEnum.TOKEN_EXPIRED,
          error.message,
        ).toResponse();
      }
      return new ApiError(
        ResponseCodeEnum.UNAUTHORIZED,
        error.message,
      ).toResponse();
    }
  }

  async generateToken(
    payload: SignTokenPayload,
    isRefreshToken = false,
  ): Promise<string> {
    const secret = this.configService.get<string>('jwt.secret');
    const expiresIn = this.configService.get<string>('jwt.expiresIn');
    const secretRefresh = this.configService.get<string>('jwt.secretRefresh');
    const expiresInRefresh = this.configService.get<string>(
      'jwt.expiresInRefresh',
    );

    const options = {
      secret: isRefreshToken ? secretRefresh : secret,
      expiresIn: isRefreshToken ? expiresInRefresh : expiresIn,
    };

    return this.jwtService.signAsync(payload, options);
  }

  getMe(user: UserEntity) {
    const data = plainToClass(UserResponse, user, {
      excludeExtraneousValues: true,
    });

    return new ResponseBuilder()
      .withData(data)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.SUCCESS)
      .build();
  }
}
