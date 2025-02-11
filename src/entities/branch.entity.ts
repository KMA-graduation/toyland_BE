import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { convertToSlug } from '@utils/common';

@Entity('branches')
export class BranchEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column()
  logo: string;

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
