import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('favorites')
export class FavoriteEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  userId: number;

  @Column()
  productId: number;

  @Column()
  rate: number;

  @Column()
  isLike: boolean;

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
