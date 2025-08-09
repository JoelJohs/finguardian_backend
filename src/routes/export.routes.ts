import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { auth, AuthRequest } from '../middlewares/auth';
import { Transaction } from '../entities/Transaction';
import { format } from 'date-fns';
import { Parser } from 'json2csv';

const router = Router();
const txRepo = () => AppDataSource.getRepository(Transaction);

/**
 * @swagger
 * /api/export/csv:
 *   get:
 *     tags: [Reports]
 *     summary: Exportar transacciones a CSV
 *     description: Exporta las transacciones del usuario en formato CSV para un rango de fechas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: end
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (YYYY-MM-DD)
 *         example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Archivo CSV generado exitosamente
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *             description: "attachment; filename=transactions.csv"
 *       400:
 *         description: Faltan parámetros requeridos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Faltan fechas"
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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