import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageEntity } from '../../entities/message.entity';
import { MessageService } from './message.service';
import { MessageGateway } from '../../gateways/message.gateway';
import { MessageController } from './message.controller';
import { UserEntity } from '@entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MessageEntity, UserEntity])],
  controllers: [MessageController],
  providers: [MessageService, MessageGateway],
  exports: [MessageService],
})
export class MessageModule {}
