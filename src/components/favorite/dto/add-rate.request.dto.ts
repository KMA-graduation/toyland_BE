import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class AddRateRequestDto {
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  rate: number;
}
