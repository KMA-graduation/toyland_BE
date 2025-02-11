import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('discounts')
export class DiscountEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  name: string;

  @Column()
  percent: number;

  @Column()
  price: number;

  @Column()
  quantity: number;

  @Column()
  actualQuantity: number;

  @Column({
    default: true,
  })
  isActive: boolean;

  //@TODO: expire discount
  // @Column()
  // expiredIn: string;

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
