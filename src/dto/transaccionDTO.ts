export interface TransactionDTO {
  amount: number;
  categoryId: number;
  description?: string;
  type: "income" | "expense";
}
