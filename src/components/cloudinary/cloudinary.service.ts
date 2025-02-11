import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';
import toStream = require('buffer-to-stream');

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  async uploadImage(
    file: Express.Multer.File,
    path: string,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const upload = v2.uploader.upload_stream(
        { folder: path },
        (error, result) => {
          if (error) console.error('--->>> cloudinary error: ', error);
          if (error) return reject(error);
          resolve(result);
        },
      );
      toStream(file.buffer).pipe(upload);
    });
  }

  async uploadImageToCloudinary(file: Express.Multer.File, path: string) {
    return await this.uploadImage(file, path).catch((err) => {
      this.logger.error('🚀[CLOUDIARY][ERROR]: ', err);

      throw new BadRequestException(
        'Có lỗi khi tải ảnh lên, vui lòng thử lại sau',
      );
    });
  }
}
