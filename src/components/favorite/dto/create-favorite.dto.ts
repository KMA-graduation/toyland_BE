import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateFavoriteDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsInt()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsOptional()
  rate?: number;

  @IsBoolean()
  @IsOptional()
  like?: boolean;
}
