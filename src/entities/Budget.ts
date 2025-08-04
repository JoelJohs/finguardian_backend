import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { Category } from "./Category";

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => Category)
  category!: Category;

  @Column('decimal', { precision: 15, scale: 2 })
  limit!: number;

  @Column({ type: 'enum', enum: ['monthly', 'weekly'] })
  period!: string;

  @CreateDateColumn()
  createdAt!: Date;
}