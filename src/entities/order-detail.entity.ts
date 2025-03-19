import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('order_details')
export class OrderDetailEntity {
  @PrimaryColumn()
  productId: number;

  @PrimaryColumn()
  orderId: number;

  @Column()
  size: string;

  @Column()
  amount: number;

  @Column()
  unitPrice: number;

  @Column()
  isRating: boolean;
}
