import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './User';

@Entity('lifetime_savings')
export class LifetimeSavings {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => User, (user) => user.id)
    user!: User;

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    totalSaved!: number;

    @Column('int', { default: 0 })
    goalsCompleted!: number;
}