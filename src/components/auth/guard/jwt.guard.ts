import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '@entities/user.entity';
import { REQUEST_USER_KEY } from 'src/constants/auth.constant';
import { ApiError } from '@utils/api.error';
import { ResponseCodeEnum } from '@enums/response-code.enum';
import { ResponseMessageEnum } from '@enums/response-message.enum';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    private readonly jwtService: JwtService,

    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new ApiError(
        ResponseCodeEnum.UNAUTHORIZED,
        ResponseMessageEnum.UNAUTHORIZED,
      ).toResponse();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const { userId } = payload;
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user)
        throw new ApiError(
          ResponseCodeEnum.UNAUTHORIZED,
          ResponseMessageEnum.UNAUTHORIZED,
        ).toResponse();

      request[REQUEST_USER_KEY] = user;
    } catch {
      throw new ApiError(
        ResponseCodeEnum.UNAUTHORIZED,
        ResponseMessageEnum.UNAUTHORIZED,
      ).toResponse();
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
