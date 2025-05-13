import { IsMe } from '@components/order/order.constant';
import { PaginationQuery } from '@utils/pagination.query';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';

export class ListOrderQuery extends PaginationQuery {
  @IsEnum(IsMe)
  @Transform(({ value }) => Number(value))
  @IsOptional()
  isMe: IsMe;

  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @IsString()
  sourceOrder?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date?: Date;
}
