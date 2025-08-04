// backend/src/entities/SavingsGoal.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { User } from "./User";

@Entity("savings_goals")
export class SavingsGoal {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, (user) => user.id)
  user!: User;

  @Column()
  name!: string;

  @Column("decimal", { precision: 15, scale: 2 })
  target_amount!: number;

  @Column("decimal", { precision: 15, scale: 2, default: 0 })
  current_amount!: number;

  @Column({ type: "timestamp" })
  deadline!: Date;

  @Column({ type: "enum", enum: ["daily", "weekly", "biweekly", "monthly"] })
  frequency!: string;

  @Column({ default: false })
  isDeleted!: boolean;

  @Column({ nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  created_at!: Date;
}
