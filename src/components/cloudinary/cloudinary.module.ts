import { Global, Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryProvider } from './cloudinary.provider';

@Global()
@Module({
  controllers: [],
  providers: [CloudinaryService, CloudinaryProvider],
})
export class CloudinaryModule {}
