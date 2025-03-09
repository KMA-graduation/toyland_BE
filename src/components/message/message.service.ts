import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Not, Repository } from 'typeorm';
import { ResponseBuilder } from '@utils/response-builder';
import { ResponseCodeEnum } from '@enums/response-code.enum';
import { ResponseMessageEnum } from '@enums/response-message.enum';
import { ListMessageQuery } from './dto/list-message-query.dto';
import { MessageEntity } from '@entities/message.entity';
import { UserEntity } from '@entities/user.entity';
import { compact, keyBy, uniq } from 'lodash';
import { plainToInstance } from 'class-transformer';
import { MessageResponseDto } from './dto/response/messsage.response.dto';
import { UserRole } from '@components/user/user.constant';
import { PaginationQuery } from '@utils/pagination.query';
import { UserResponse } from '@components/auth/dto/response/auth.response.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(request: CreateMessageDto) {
    const message = new MessageEntity();
    message.senderId = request.senderId;
    message.receiverId = request.receiverId;
    message.content = request.content;

    const result = await this.messageRepository.save(message);
    return result;
  }

  async getUserMessage(senderId: number, receiverId: number) {
    try {
      const [users, messages] = await Promise.all([
        this.userRepository.find({
          where: {
            id: In([senderId, receiverId]),
          },
        }),
        this.messageRepository.find({
          where: [
            {
              senderId: In([senderId, receiverId]),
              receiverId: In([senderId, receiverId]),
            },
          ],
          order: {
            id: 'ASC',
          },
        }),
      ]);

      const userMap = keyBy(users, 'id');
      messages.forEach((message) => {
        const { senderId, receiverId } = message;
        message['sender'] = userMap[senderId] || {};
        message['receiver'] = userMap[receiverId] || {};
      });

      const data = plainToInstance(MessageResponseDto, messages, {
        excludeExtraneousValues: true,
      });

      return new ResponseBuilder(data)
        .withCode(ResponseCodeEnum.SUCCESS)
        .build();
    } catch (error) {
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.SERVER_ERROR)
        .build();
    }
  }

  async getCustomerMessage(request: PaginationQuery) {
    try {
      const userAdmin = await this.userRepository.findOne({
        where: { role: UserRole.Admin },
      });

      const condition = new Brackets((qb) => {
        qb.where('message.senderId != :adminId', {
          adminId: userAdmin.id,
        }).orWhere('message.receiverId != :adminId', {
          adminId: userAdmin.id,
        });
      });

      const messages = await this.messageRepository
        .createQueryBuilder('message')
        .select([
          'message.senderId AS "senderId"',
          'message.receiverId AS "receiverId"',
        ])
        .where(condition)
        .orderBy('message.id', 'DESC')
        .getRawMany();

      const userIds = [];
      messages.forEach((message) => {
        const { senderId, receiverId } = message;
        if (userAdmin.id === senderId) {
          userIds.push(receiverId);
          return;
        }
        if (userAdmin.id === receiverId) {
          userIds.push(senderId);
          return;
        }
        userIds.push(senderId, receiverId);
      });

      const users = await this.userRepository.find({
        where: {
          id: In(uniq(compact(userIds))),
        },
        order: {
          id: 'ASC',
        },
      });

      const userResponse = plainToInstance(UserResponse, users, {
        excludeExtraneousValues: true,
      });

      return new ResponseBuilder(userResponse)
        .withCode(ResponseCodeEnum.SUCCESS)
        .build();
    } catch (error) {
      console.log('🚀 [LOGGER] error:', error);
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.SERVER_ERROR)
        .build();
    }
  }

  async remove(id: number, currentUser: UserEntity) {
    const message = await this.getMessageExist(id);
    if (!message) throw new NotFoundException(ResponseMessageEnum.NOT_FOUND);

    // Security check: Only allow the sender to delete their own message
    if (message.senderId !== currentUser.id) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.messageRepository.delete(id);

    return new ResponseBuilder()
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.DELETE_SUCCESS)
      .build();
  }

  private async getMessageExist(id: number) {
    return this.messageRepository.findOne({
      where: {
        id,
      },
    });
  }

  async findOneById(id: number): Promise<MessageEntity> {
    return this.messageRepository.findOne({
      where: {
        id,
      },
    });
  }

  async createMessage(
    senderId: number,
    content: string,
    receiverId?: number,
  ): Promise<MessageEntity> {
    const message = this.messageRepository.create({
      senderId,
      content,
      receiverId,
    });
    return await this.messageRepository.save(message);
  }

  async markMessageAsRead(messageId: number): Promise<MessageEntity> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });
    if (message) {
      return await this.messageRepository.save(message);
    }
    return null;
  }

  async markAsUnsent(messageId: number): Promise<MessageEntity> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    message.content = 'Tin nhắn đã được gỡ';
    message.isUnsent = true;

    return await this.messageRepository.save(message);
  }
}
