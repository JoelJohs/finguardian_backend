import { AppDataSource } from '../config/database';
import { Budget } from '../entities/Budget';
import { Transaction } from '../entities/Transaction';

const budgetRepo = AppDataSource.getRepository(Budget);
const txRepo = AppDataSource.getRepository(Transaction);

export interface BudgetAlert {
    alert: boolean;
    overspent?: number;
    remaining?: number;
}

export interface BudgetWithSpent extends Budget {
    spent: number;
}

export async function calculateSpentAmount(budget: Budget): Promise<number> {
    // Calcular período actual basado en la fecha de creación del presupuesto
    const now = new Date();
    let startDate: Date;

    if (budget.period === 'monthly') {
        // Para presupuesto mensual: desde la fecha de creación o inicio del mes actual
        const budgetCreated = new Date(budget.createdAt);
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = budgetCreated > currentMonthStart ? budgetCreated : currentMonthStart;
    } else {
        // Para presupuesto semanal: últimos 7 días desde ahora, pero no antes de la creación
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        const budgetCreated = new Date(budget.createdAt);
        startDate = budgetCreated > weekAgo ? budgetCreated : weekAgo;
    }

    // Obtener gastos desde la fecha calculada
    const result = await txRepo
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.amount), 0)', 'total')
        .where('t.userId = :userId', { userId: budget.user.id })
        .andWhere('t.categoryId = :categoryId', { categoryId: budget.category.id })
        .andWhere('t.type = :type', { type: 'expense' })
        .andWhere('t.created_at >= :startDate', { startDate })
        .getRawOne();

    return parseFloat(result.total || '0');
}

export async function getBudgetsWithSpent(userId: string): Promise<BudgetWithSpent[]> {
    const budgets = await budgetRepo.find({
        where: { user: { id: userId } },
        relations: ['category', 'user'],
        order: { createdAt: 'DESC' },
    });

    const budgetsWithSpent: BudgetWithSpent[] = [];

    for (const budget of budgets) {
        const spent = await calculateSpentAmount(budget);
        budgetsWithSpent.push({
            ...budget,
            spent
        });
    }

    return budgetsWithSpent;
}

export async function checkBudgetAlert(
    userId: string,
    categoryId: number,
    amount: number,
    period: 'monthly' | 'weekly'
): Promise<BudgetAlert | null> {
    // 1. Buscar presupuesto activo
    const budget = await budgetRepo.findOne({
        where: {
            user: { id: userId },
            category: { id: categoryId }
        },
        relations: ['user', 'category']
    });
    if (!budget) return null; // Sin presupuesto = sin alerta

    // 2. Calcular gasto actual + el nuevo gasto
    const currentSpent = await calculateSpentAmount(budget);
    const totalSpent = currentSpent + amount;
    const remaining = budget.limit - totalSpent;

    if (remaining < 0) {
        return { alert: true, overspent: Math.abs(remaining) };
    }
    return { alert: false, remaining };
}