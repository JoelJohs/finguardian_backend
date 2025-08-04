export interface SavingsGoalDTO {
  name: string;
  targetAmount: number;
  deadline: string; // ISO
  frequency: "daily" | "weekly" | "biweekly" | "monthly";
}
