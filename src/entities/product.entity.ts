import { convertToSlug } from '@utils/common';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  categoryId: number;

  @Column()
  branchId: number;

  @Column()
  shopifyId: number;

  @Column()
  shopBaseId: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  price: number;

  @Column()
  salePrice: number;

  @Column()
  stockAmount: number;

  @Column()
  type: string;

  @Column()
  slug: string;

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

  @BeforeInsert()
  @BeforeUpdate()
  convertToSlug() {
    this.slug = convertToSlug(this.name);
  }
}
