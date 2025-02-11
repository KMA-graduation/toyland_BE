import { Transform } from 'class-transformer';
import { Allow, IsInt, IsOptional, IsString } from 'class-validator';

export class PaginationQuery {
  @IsInt()
  @Transform(({ value }) => +value)
  @IsOptional()
  isGetAll: number;

  @IsString()
  @IsOptional()
  keyword?: string;

  @Allow()
  @Transform((value) => {
    return Number(value.value) || 1;
  })
  page?: number = 1;

  @Allow()
  @Transform((value) => {
    return Number(value.value) || 10;
  })
  limit?: number;

  get take(): number {
    const limit = Number(this.limit) || 10;
    return limit > 0 && limit <= 100 ? limit : 10;
  }

  get skip(): number {
    const page = (Number(this.page) || 1) - 1;

    return (page < 0 ? 0 : page) * this.take;
  }

  @IsString()
  @IsOptional()
  category?: number;

  @IsString()
  @IsOptional()
  sort?: string;
}
