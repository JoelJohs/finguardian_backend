import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Transaction } from "../entities/Transaction";
import { Category } from "../entities/Category";
import { SavingsGoal } from "../entities/SavingsGoal";
import { LifetimeSavings } from "../entities/LifetimeSavings";
import { RecurringTransaction } from "../entities/RecurringTransaction";
import { Budget } from "../entities/Budget";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "root",
  database: "fin_guardian",
  synchronize: true,
  logging: true,
  entities: [User, Transaction, Category, SavingsGoal, LifetimeSavings, RecurringTransaction, Budget],
});
