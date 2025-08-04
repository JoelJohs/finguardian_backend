// src/services/dashboard.service.ts
import { AppDataSource } from "../config/database";
import { Transaction } from "../entities/Transaction";
import { Between } from "typeorm";

export interface Summary {
  income: number;
  expense: number;
  balance: number;
  byCategory: { category: string; total: number }[];
}

export async function getSummary(
  userId: string,
  from: Date,
  to: Date
): Promise<Summary> {
  const repo = AppDataSource.getRepository(Transaction);

  const raw = await repo
    .createQueryBuilder("t")
    .select("t.type", "type")
    .addSelect("SUM(t.amount)", "total")
    .addSelect("c.name", "category")
    .leftJoin("t.category", "c")
    .where("t.userId = :userId", { userId })
    .andWhere("t.created_at BETWEEN :from AND :to", { from, to })
    .groupBy("t.type, c.name")
    .getRawMany();

  const income = raw
    .filter((r) => r.type === "income")
    .reduce((acc, r) => acc + parseFloat(r.total), 0);

  const expense = raw
    .filter((r) => r.type === "expense")
    .reduce((acc, r) => acc + parseFloat(r.total), 0);

  const byCategory = raw
    .filter((r) => r.type === "expense")
    .map((r) => ({ category: r.category, total: parseFloat(r.total) }))
    .sort((a, b) => b.total - a.total);

  return { income, expense, balance: income - expense, byCategory };
}
