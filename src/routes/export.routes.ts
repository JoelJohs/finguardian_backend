import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { auth, AuthRequest } from '../middlewares/auth';
import { Transaction } from '../entities/Transaction';
import { format } from 'date-fns';
import { Parser } from 'json2csv';

const router = Router();
const txRepo = () => AppDataSource.getRepository(Transaction);

// GET /api/export/csv?start=2024-07-01&end=2024-07-31
router.get('/csv', auth, async (req: AuthRequest, res) => {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ error: 'Faltan fechas' });

    const data = await txRepo()
        .createQueryBuilder('t')
        .leftJoinAndSelect('t.category', 'c')
        .where('t.userId = :userId', { userId: req.userId })
        .andWhere('t.created_at BETWEEN :start AND :end', { start, end })
        .orderBy('t.created_at', 'DESC')
        .getMany();

    const fields = ['created_at', 'amount', 'type', 'description', 'category.name'];
    const parser = new Parser({ fields });
    const csv = parser.parse(
        data.map((t) => ({
            ...t,
            created_at: format(t.created_at, 'yyyy-MM-dd HH:mm'),
            'category.name': t.category.name,
        }))
    );

    res.header('Content-Type', 'text/csv');
    res.attachment(`fin-guardian-${start}-to-${end}.csv`);
    res.send(csv);
});

export default router;