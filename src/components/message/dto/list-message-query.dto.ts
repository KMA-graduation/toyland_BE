import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ListMessageQuery {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  take?: number = 10;

  get skip(): number {
    return (this.page - 1) * this.take;
  }
}
