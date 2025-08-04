import { AppDataSource } from '../config/database';
import { LifetimeSavings } from '../entities/LifetimeSavings';

const repo = () => AppDataSource.getRepository(LifetimeSavings);

export async function addToLifetime(userId: string, amount: number) {
    let record = await repo().findOne({
        where: { user: { id: userId } }
    });

    if (!record) {
        record = repo().create({
            user: { id: userId },
            totalSaved: 0,
            goalsCompleted: 0
        });
    }

    // Convertir a números para evitar problemas de tipos
    const currentTotal = parseFloat(record.totalSaved.toString());
    record.totalSaved = currentTotal + amount;
    record.goalsCompleted += 1;

    await repo().save(record);
}

export async function getLifetime(userId: string) {
    const record = await repo().findOne({
        where: { user: { id: userId } }
    });

    return {
        totalSaved: record ? parseFloat(record.totalSaved.toString()) : 0,
        goalsCompleted: record ? record.goalsCompleted : 0
    };
}