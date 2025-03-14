import {
  AUTH_UPLOAD_FIELD,
  AUTH_UPLOAD_LIMIT_IMAGES,
  AUTH_UPLOAD_PATH,
  PRODUCT_UPLOAD_FILE_TYPES,
  PRODUCT_UPLOAD_LIMIT_IMAGES,
} from '@components/product/product.constant';
import { setUploadOptions } from '@config/multer.config';
import { Auth } from '@decorators/auth.decorator';
import { AuthUser } from '@decorators/user.decorator';
import { UserEntity } from '@entities/user.entity';
import { AuthType } from '@enums/auth.enum';
import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { UpdateAvatar } from './dto/update-avatar';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @UseInterceptors(
    FilesInterceptor(
      AUTH_UPLOAD_FIELD,
      PRODUCT_UPLOAD_LIMIT_IMAGES,
      setUploadOptions(AUTH_UPLOAD_PATH, PRODUCT_UPLOAD_FILE_TYPES),
    ),
  )
  @Auth(AuthType.Public)
  async signUp(
    @Body()
    signUpDto: SignUpDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    if (files) {
      signUpDto['file'] = { ...files[0] };
    }

    return this.authService.signUp(signUpDto);
  }

  @Post('sign-in')
  @Auth(AuthType.Public)
  async signIn(
    @Body()
    signInDto: SignInDto,
  ) {
    return this.authService.signIn(signInDto);
  }

  @Post('refresh-token')
  @Auth(AuthType.Public)
  async refreshToken(@AuthUser() user: UserEntity) {
    return this.authService.refreshToken(user);
  }

  @Get('me')
  @Auth(AuthType.Jwt)
  getMe(@AuthUser() user: UserEntity) {
    return this.authService.getMe(user);
  }

  @Post('avatar')
  @UseInterceptors(
    FilesInterceptor(
      AUTH_UPLOAD_FIELD,
      PRODUCT_UPLOAD_LIMIT_IMAGES,
      setUploadOptions(AUTH_UPLOAD_PATH, PRODUCT_UPLOAD_FILE_TYPES),
    ),
  )
  @Auth(AuthType.Jwt)
  async updateAvatar(
    @Body()
    request: UpdateAvatar,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @AuthUser() user: UserEntity,
  ) {
    if (files) {
      request['file'] = { ...files[0] };
    }
    return this.authService.updateAvatar(request, user);
  }
}
