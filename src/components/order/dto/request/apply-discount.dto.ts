import { IsOptional, IsString } from 'class-validator';

export class ApplyDiscountDto {
  @IsString()
  @IsOptional()
  discountCode: string;
}
