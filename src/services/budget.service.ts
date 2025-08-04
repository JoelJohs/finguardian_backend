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

    // 2. Calcular período actual
    const now = new Date();
    let start: Date;
    if (period === 'monthly') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
        start = new Date(now);
        start.setDate(now.getDate() - 7);
    }

    // 3. Gasto acumulado en el período
    const spent = await txRepo
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.amount),0)', 'total')
        .where('t.userId = :userId', { userId })
        .andWhere('t.categoryId = :categoryId', { categoryId })
        .andWhere('t.type = :type', { type: 'expense' })
        .andWhere('t.created_at >= :start', { start })
        .getRawOne();

    const totalSpent = parseFloat(spent.total || 0) + amount;
    const remaining = budget.limit - totalSpent;

    if (remaining < 0) {
        return { alert: true, overspent: Math.abs(remaining) };
    }
    return { alert: false, remaining };
}