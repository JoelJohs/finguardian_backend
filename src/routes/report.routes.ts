// src/routes/report.routes.ts
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { auth, AuthRequest } from '../middlewares/auth';
import { Between } from 'typeorm';
import { Transaction } from '../entities/Transaction';

const router = Router();
const txRepo = () => AppDataSource.getRepository(Transaction);

// GET /api/reports/trend?start=2024-07-01&end=2024-07-31
router.get('/trend', auth, async (req: AuthRequest, res) => {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ error: 'Faltan fechas' });

    const raw = await txRepo()
        .createQueryBuilder('t')
        .select("DATE_TRUNC('day', t.created_at)", 'day')
        .addSelect('SUM(CASE WHEN t.type = :income THEN t.amount ELSE 0 END)', 'income')
        .addSelect('SUM(CASE WHEN t.type = :expense THEN t.amount ELSE 0 END)', 'expense')
        .where('t.userId = :userId', { userId: req.userId })
        .andWhere('t.created_at BETWEEN :start AND :end', { start, end })
        .groupBy('day')
        .orderBy('day')
        .setParameters({ income: 'income', expense: 'expense' })
        .getRawMany();

    const trend = raw.map(r => ({
        date: r.day.split('T')[0],
        income: parseFloat(r.income),
        expense: parseFloat(r.expense),
    }));
    res.json(trend);
});

// GET /api/reports/category?start=2024-07-01&end=2024-07-31
router.get('/category', auth, async (req: AuthRequest, res) => {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ error: 'Faltan fechas' });

    const raw = await txRepo()
        .createQueryBuilder('t')
        .select('c.name', 'category')
        .addSelect('SUM(t.amount)', 'total')
        .leftJoin('t.category', 'c')
        .where('t.userId = :userId', { userId: req.userId })
        .andWhere('t.type = :type', { type: 'expense' })
        .andWhere('t.created_at BETWEEN :start AND :end', { start, end })
        .groupBy('c.name')
        .orderBy('total', 'DESC')
        .getRawMany();

    const category = raw.map(r => ({
        category: r.category,
        total: parseFloat(r.total),
    }));
    res.json(category);
});

export default router;