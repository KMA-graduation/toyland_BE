import { extname } from 'path';
import { v4 as uuid } from 'uuid';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { HttpException, HttpStatus } from '@nestjs/common';
import { DEFAULT_MAX_FILE_SIZE } from 'src/constants/multer.constant';

export const setUploadOptions = (
  uploadPath: string,
  supportFileTypes: string[],
  maxSize?: number,
) => ({
  limits: {
    fileSize: maxSize || DEFAULT_MAX_FILE_SIZE,
  },

  fileFilter: (req: any, file: any, cb: any) => {
    if (supportFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new HttpException(
          `Không hỗ trợ kiểu file ${extname(file.originalname)}`,
          HttpStatus.BAD_REQUEST,
        ),
        false,
      );
    }
  },

  storage: diskStorage({
    destination: (req: any, file: any, cb: any) => {
      if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true });

      cb(null, uploadPath);
    },
    filename: (req: any, file: any, cb: any) => {
      cb(null, `${uuid()}${extname(file.originalname)}`);
    },
  }),
});
