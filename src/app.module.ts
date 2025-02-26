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
      ssl: {
        rejectUnauthorized: true,
        ca: `-----BEGIN CERTIFICATE-----
MIIETTCCArWgAwIBAgIUUjFLGjsKmL54hQaLufT65gfYk9swDQYJKoZIhvcNAQEM
BQAwQDE+MDwGA1UEAww1YzM5MDE3ZjMtNmMxZi00NTZlLWEyM2EtZDRkYThhM2U5
YTIyIEdFTiAxIFByb2plY3QgQ0EwHhcNMjUwMjI2MTU1NDU4WhcNMzUwMjI0MTU1
NDU4WjBAMT4wPAYDVQQDDDVjMzkwMTdmMy02YzFmLTQ1NmUtYTIzYS1kNGRhOGEz
ZTlhMjIgR0VOIDEgUHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCC
AYoCggGBALYTJKzq+23+a6AS9IstCvZrPdxstz+oQUjvsYdTncuTkPfRc8/IJ1hO
V5N6qZrg80WPx9QcbxAmhlY/fk/5CI9mEXIBl+4hd4q+Gt/1NGIFQqBZaXNHZLPE
IgSSIVMPFDZuxSqpv0KFa3lfWENIKbDmsi1t2ZEzGVkUPqdeaUz76a878l/fUR6o
CwzY9P27qh8GAtRn2o/QXAn7oNHqiJUGReElHFmpTJq690x8mPVMcZHBTbJJO8mA
OWEbAQ/LacHy7wPHhhtKhfpuftDJXQImSfDA59G4PhPWvwfatDAM3zbXTMCROUVE
CZOWgjQgb5XN8/8fjCIK6tdB6SK4La0AAPpfioi5RnDsm5DIcYu3daid9kKWR81h
/h31pBh/r/CCBo3JTbf75884khiuzMFqzAy7eKFt3BKmLcENUPM7PP0nak1nd+ay
UVMnei65wmb7BxleZUFu1rbFSQ+kkK/3lmb8FvNgWNJrI4NYoqFz6aXUeVFPXM0r
AzrusJgrbQIDAQABoz8wPTAdBgNVHQ4EFgQU3UWj6vW9przFlrUlixgwIGkmfD4w
DwYDVR0TBAgwBgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQADggGB
ABQNeJO+7o6bcg4EG4BuUrfwkwLI8e4iNzh7Df4fRuwGe8SeDI1YsrgQ+mA0kZbc
z+E0mZjanqO1tHfpBO2oKl3Yxryz+lHuHxGOTFgJWfQEenjcBHUoElgjtxsjM9Us
3rO8QI9n9QTlBxbErUlodBRzjfRMDwMqsWxk+qBH3S6cWcsMaYR+my/Xz/h+y5rC
qAMbe5MJxwm/7JJ9REikuR8HO87vbPwij0uXB1kpb9fC7lnBUixxXxJcAwUwQEkp
rSIgTI8+yMpvv3OtcWZwNEpv+g/m/st5E6tfc1NAErNLo/6TiaNBuU4yC2FRVnVv
25vCh8vDrOQYYcXxkLDgwI/HGzt+ppRE2DMUDbUiHYLGpPglJPhX7Jg64aeHF+rE
B7iP659vWNPpmgKl24muavP5R7jckLU7p99k6K+ABAZY6BygP3ObuWt5JzHaiK/W
HRkkAjKPgOk7OyS9PeUatBHBqZzGkF8ESUs84HCe4kloENhXaxnDb8JyizTLv4w6
Mg==
-----END CERTIFICATE-----
`,
    },
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
