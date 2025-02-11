import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('product_images')
export class ProductImageEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  productId: number;

  @Column()
  url: string;

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
