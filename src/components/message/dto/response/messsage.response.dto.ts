import { UserResponse } from '@components/auth/dto/response/auth.response.dto';
import { Expose, Type } from 'class-transformer';

export class MessageResponseDto {
  @Expose()
  id: number;

  @Expose()
  senderId: number;

  @Expose()
  receiverId: number;

  @Expose()
  content: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => UserResponse)
  sender: UserResponse;

  @Expose()
  @Type(() => UserResponse)
  receiver: UserResponse;
}
