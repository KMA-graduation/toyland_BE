import { PaginationQuery } from '@utils/pagination.query';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class ListProductQuery extends PaginationQuery {
  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @IsString()
  sourceProduct?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date?: Date;
}
