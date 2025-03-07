import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomValidationPipe } from '@utils/validation.pipe';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api/v1');
  const port = 3100;
  app.enableCors();
  app.useGlobalPipes(new CustomValidationPipe());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useStaticAssets('uploads', {
    prefix: '/uploads',
  });

  await app.listen(port, () =>
    console.log(`Server is running on port ${port}`),
  );
}
bootstrap();
