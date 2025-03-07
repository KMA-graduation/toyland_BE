import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('messages')
export class MessageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column()
  senderId: number;

  @Column()
  receiverId: number;

  @Column()
  isUnsent?: boolean;

  @Column()
  isRead?: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
