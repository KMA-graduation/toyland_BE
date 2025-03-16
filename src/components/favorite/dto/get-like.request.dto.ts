import { PaginationQuery } from '@utils/pagination.query';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class GetLikeRequestDto extends PaginationQuery {
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  productId?: number;
}
