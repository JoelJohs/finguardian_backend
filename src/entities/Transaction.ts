// src/entities/Transaction.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "./User";
import { Category } from "./Category";

@Entity("transactions")
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("decimal", { precision: 15, scale: 2 })
  amount!: number;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "enum", enum: ["income", "expense"] })
  type!: "income" | "expense";

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @ManyToOne(() => Category)
  @JoinColumn({ name: "categoryId" })
  category!: Category;

  @CreateDateColumn()
  created_at!: Date;
}
