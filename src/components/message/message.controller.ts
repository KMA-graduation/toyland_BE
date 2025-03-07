import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { ListMessageQuery } from './dto/list-message-query.dto';
import { Auth } from '@decorators/auth.decorator';
import { AuthType } from '@enums/auth.enum';

import { AuthUser } from '@decorators/user.decorator';
import { UserEntity } from '@entities/user.entity';
import { PaginationQuery } from '@utils/pagination.query';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  @Auth(AuthType.Public)
  create(
    @Body() request: CreateMessageDto,
    @AuthUser() currentUser: UserEntity,
  ) {
    // Ensure the sender is the current user
    if (request.senderId && request.senderId !== currentUser.id) {
      throw new ForbiddenException('You can only send messages as yourself');
    }

    // Set the sender ID to the current user if not provided
    if (!request.senderId) {
      request.senderId = currentUser.id;
    }

    return this.messageService.create(request);
  }

  @Get('/:senderId/:receiverId')
  @Auth(AuthType.Public)
  getUserMessage(
    @Param('senderId') senderId: number,
    @Param('receiverId') receiverId: number,
  ) {
    return this.messageService.getUserMessage(senderId, receiverId);
  }

  @Get()
  @Auth(AuthType.Public)
  getCustomerMessage(@Query() request: PaginationQuery) {
    return this.messageService.getCustomerMessage(request);
  }
}
