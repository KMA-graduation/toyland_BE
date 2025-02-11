import { IsDateString, IsOptional } from 'class-validator';

export class RevenueDto {
  @IsOptional()
  @IsDateString()
  startDate: Date;

  @IsOptional()
  @IsDateString()
  endDate: Date;
}
