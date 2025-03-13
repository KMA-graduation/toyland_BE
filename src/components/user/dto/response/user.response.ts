import { Expose } from 'class-transformer';

export class UserResponse {
  @Expose()
  id: number;

  @Expose()
  phone: string;

  @Expose()
  email: string;

  @Expose()
  username: string;

  @Expose()
  gender: number;

  @Expose()
  role: number;

  @Expose()
  avatar: string;

  @Expose()
  birth: string;

  @Expose()
  address: string;

  @Expose()
  isActive: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
