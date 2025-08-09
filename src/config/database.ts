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
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_DATABASE || "fin_guardian",
  synchronize: true,
  logging: true,
  entities: [User, Transaction, Category, SavingsGoal, LifetimeSavings, RecurringTransaction, Budget],
});
