import { AppDataSource } from '../config/database';
import { RecurringTransaction } from '../entities/RecurringTransaction';
import { Transaction } from '../entities/Transaction';
import { LessThanOrEqual } from 'typeorm';

export async function runRecurring() {
    const now = new Date();
    const repo = AppDataSource.getRepository(RecurringTransaction);
    const txRepo = AppDataSource.getRepository(Transaction);

    const due = await repo.find({
        where: { nextRun: LessThanOrEqual(now), active: true },
        relations: ['user', 'category'],
    });

    for (const rec of due) {
        // generar transacción
        await txRepo.save(
            txRepo.create({
                user: rec.user,
                category: rec.category,
                amount: rec.amount,
                type: rec.type,
                description: `Recurrente: ${rec.category.name}`,
            })
        );
        // avanzar siguiente ejecución
        const next = new Date(rec.nextRun);
        switch (rec.frequency) {
            case 'daily': next.setDate(next.getDate() + 1); break;
            case 'weekly': next.setDate(next.getDate() + 7); break;
            case 'biweekly': next.setDate(next.getDate() + 14); break;
            case 'monthly': next.setMonth(next.getMonth() + 1); break;
        }
        rec.nextRun = next;
        await repo.save(rec);
    }
}