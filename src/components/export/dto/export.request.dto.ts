import { TypeEnum } from '@components/export/export.constant';
import { PaginationQuery } from '@utils/pagination.query';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';

export class ExportRequestDto extends PaginationQuery {
  @IsEnum(TypeEnum)
  @Transform(({ value }) => Number(value))
  @IsNotEmpty()
  type: number;

  @IsOptional()
  @IsString()
  queryIds?: string;
}
