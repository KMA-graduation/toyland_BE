import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  codeVnpay: string;

  @Column()
  userId: number;

  @Column()
  discountId: number;

  @Column()
  totalPrice: number;

  @Column()
  totalAmount: number;

  @Column({
    enum: ['online', 'offline'],
  })
  paymentType: string;

  @Column()
  phone: string;

  @Column()
  receiver: string;

  @Column()
  address: string;

  @Column()
  note: string;

  @Column({
    enum: [
      'in_cart',
      'waiting_confirm',
      'confirmed',
      'shipping',
      'received',
      'success',
      'reject',
    ],
  })
  status: string;

  @Column({
    default: true,
  })
  isActive: boolean;

  @CreateDateColumn({
    default: new Date(),
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    default: new Date(),
    type: 'timestamp',
  })
  updatedAt: Date;
}
