import { PaginationQuery } from '@utils/pagination.query';
import { IsOptional, IsString } from 'class-validator';

export class ListUserQuery extends PaginationQuery {
      @IsOptional()
      @IsString()
      search: string;
    
      @IsOptional()
      @IsString()
      sourceUser?: string;
}
