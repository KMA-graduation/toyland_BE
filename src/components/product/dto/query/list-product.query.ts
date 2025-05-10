import { PaginationQuery } from '@utils/pagination.query';
import { IsOptional, IsString } from 'class-validator';

export class ListProductQuery extends PaginationQuery {
  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @IsString()
  sourceProduct?: string;
}
