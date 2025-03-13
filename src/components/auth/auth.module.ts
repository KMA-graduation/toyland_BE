import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { JwtGuard } from './guard/jwt.guard';
import { AuthGuard } from './guard/auth.guard';
import { UserEntity } from '@entities/user.entity';
import { RolesGuard } from './guard/roles.guard';
import { MailModule } from '@components/mail/mail.module';
import { MailService } from '@components/mail/mail.service';
import { CloudinaryService } from '@components/cloudinary/cloudinary.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), JwtModule, ConfigModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtGuard,
    CloudinaryService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AuthModule {}
