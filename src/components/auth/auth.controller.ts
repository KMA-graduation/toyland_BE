import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { Auth } from '@decorators/auth.decorator';
import { AuthType } from '@enums/auth.enum';
import { AuthUser } from '@decorators/user.decorator';
import { UserEntity } from '@entities/user.entity';
import { AuthRefreshPayload, AuthResponse } from './auth.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @Auth(AuthType.Public)
  async signUp(
    @Body()
    signUpDto: SignUpDto,
  ) {
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
}
