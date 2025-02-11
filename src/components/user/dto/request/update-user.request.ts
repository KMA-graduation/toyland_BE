import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.request';

export class UpdateUserRequest extends PartialType(CreateUserDto) {}
