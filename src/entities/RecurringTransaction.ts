import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { Category } from "./Category";

@Entity('recurring_transactions')
export class RecurringTransaction {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => User)
    user!: User;

    @ManyToOne(() => Category)
    category!: Category;

    @Column('decimal', { precision: 15, scale: 2 })
    amount!: number;

    @Column({ type: 'enum', enum: ['income', 'expense'] })
    type!: 'income' | 'expense';

    @Column({ type: 'enum', enum: ['daily', 'weekly', 'biweekly', 'monthly'] })
    frequency!: string;

    @Column({ type: 'date' })
    nextRun!: Date;

    @Column({ default: true })
    active!: boolean;

    @CreateDateColumn()
    createdAt!: Date;
}