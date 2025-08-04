export interface BudgetDTO {
    limit: number;
    categoryId: number;
    period: 'monthly' | 'weekly';
}