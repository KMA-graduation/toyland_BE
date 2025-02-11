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

@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  thumb: string;

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
