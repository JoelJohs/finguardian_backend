import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { auth, AuthRequest } from '../middlewares/auth';
import { Transaction } from '../entities/Transaction';
import { buildTransactionPDF } from '../utils/pdfGenerator';

const router = Router();
const txRepo = () => AppDataSource.getRepository(Transaction);

// GET /api/export/pdf?start=2024-07-01&end=2024-07-31
router.get('/pdf', auth, async (req: AuthRequest, res) => {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ error: 'Faltan fechas' });

    const data = await txRepo()
        .createQueryBuilder('t')
        .leftJoinAndSelect('t.category', 'c')
        .where('t.userId = :userId', { userId: req.userId })
        .andWhere('t.created_at BETWEEN :start AND :end', { start, end })
        .orderBy('t.created_at', 'DESC')
        .getMany();

    const doc = buildTransactionPDF(data, req.userId!, start as string, end as string);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="fin-guardian-${start}-${end}.pdf"`);
    doc.pipe(res);
});

export default router;