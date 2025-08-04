import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  type!: "income" | "expense";

  @Column({ default: "📦" })
  icon!: string;

  @Column({ default: "#6366f1" })
  color!: string;
}
