import {
  ArgumentMetadata,
  HttpException,
  HttpStatus,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class CustomValidationPipe implements PipeTransform {
  async transform(value: any, metaData: ArgumentMetadata) {
    const { metatype } = metaData;
    // if (this.isEmpty(value)) {
    //   throw new HttpException(`No payload`, HttpStatus.BAD_REQUEST);
    // }

    const object = plainToClass(metatype, value);

    const errors = await validate(object);

    if (errors.length > 0) {
      throw new HttpException(
        `${this.formatError(errors)}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return object;
  }

  private isEmpty(value: any) {
    if (Object.keys(value).length < 1) {
      return true;
    }
    return false;
  }

  private formatError(errors: any[]) {
    return errors
      .map((error) => {
        for (let key in error.constraints) {
          return error.constraints[key];
        }
      })
      .join(',');
  }
}
