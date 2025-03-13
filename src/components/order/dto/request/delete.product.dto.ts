import { IsArray, IsNotEmpty } from 'class-validator';

export class DeleteProductDto {
  @IsArray()
  @IsNotEmpty()
  productIds: number[];
}
