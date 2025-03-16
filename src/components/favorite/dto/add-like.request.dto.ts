import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class AddLikeRequestDto {
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  productId: number;
}
