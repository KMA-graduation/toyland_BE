import { IsOptional } from 'class-validator';

export class UpdateAvatar {
  @IsOptional()
  file?: any;
}
