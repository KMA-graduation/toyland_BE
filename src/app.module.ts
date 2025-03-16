import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './components/user/user.module';
import { ProductModule } from './components/product/product.module';
import { OrderModule } from './components/order/order.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { CategoryModule } from './components/category/category.module';
import { BranchModule } from './components/branch/branch.module';
import { DiscountModule } from './components/discount/discount.module';
import { ConfigModule } from '@nestjs/config';
import appConfig from '@config/app.config';
import { AuthModule } from '@components/auth/auth.module';
import { DashboardModule } from '@components/dashboard/dashboard.module';
import { CloudinaryModule } from '@components/cloudinary/cloudinary.module';
import { ShopifyModule } from '@components/shopify/shopify.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ExportModule } from '@components/export/export.module';
import { ShopBaseModule } from '@components/shopbase/shopbase.module';
import { MailModule } from '@components/mail/mail.module';
import { MessageModule } from '@components/message/message.module';
import { MessageGateway } from './gateways/message.gateway';
import { FavoriteModule } from '@components/favorite/favorite.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_POSTGRES_PORT) || 5432,
      username: process.env.DATABASE_POSTGRES_USERNAME || 'root',
      password: process.env.DATABASE_POSTGRES_PASSWORD || '123456',
      database: process.env.DATABASE_NAME || 'ecommerce',
      logging: false,
      entities: [path.join(__dirname, 'entities/**/*.entity.{ts,js}')],
      migrations: [path.join(__dirname, 'migrations/*.{ts,js}')],
      // We are using migrations, synchronize should be set to false.
      synchronize: false,
      // Run migrations automatically,
      // you can disable this if you prefer running migration manually.
      migrationsRun: true,
      extra: {
        max: parseInt(process.env.DATABASE_MAX_POOL) || 20,
      },
      namingStrategy: new SnakeNamingStrategy(),
      // ssl: {
      //   rejectUnauthorized: false,
      // },
    }),
    MailModule,
    ScheduleModule.forRoot(),
    UserModule,
    ProductModule,
    OrderModule,
    CategoryModule,
    BranchModule,
    DiscountModule,
    AuthModule,
    DashboardModule,
    CloudinaryModule,
    ShopifyModule,
    ExportModule,
    ShopBaseModule,
    MessageModule,
    FavoriteModule,
  ],
  controllers: [AppController],
  providers: [AppService, MessageGateway],
})
export class AppModule {}
