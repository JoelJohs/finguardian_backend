// src/routes/report.routes.ts
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { auth, AuthRequest } from '../middlewares/auth';
import { Between } from 'typeorm';
import { Transaction } from '../entities/Transaction';

const router = Router();
const txRepo = () => AppDataSource.getRepository(Transaction);

/**
 * @swagger
 * /api/reports/trend:
 *   get:
 *     tags: [Reports]
 *     summary: Obtener tendencia de ingresos y gastos
 *     description: Retorna la tendencia diaria de ingresos y gastos en un rango de fechas
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
 *         description: Tendencia obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date
 *                     description: Fecha del día
 *                   income:
 *                     type: number
 *                     description: Total de ingresos del día
 *                   expense:
 *                     type: number
 *                     description: Total de gastos del día
 *             example:
 *               - date: "2024-01-15"
 *                 income: 500.00
 *                 expense: 300.00
 *               - date: "2024-01-16"
 *                 income: 0.00
 *                 expense: 150.00
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

/**
 * @swagger
 * /api/reports/category:
 *   get:
 *     tags: [Reports]
 *     summary: Obtener reporte de gastos por categoría
 *     description: Retorna el total de gastos agrupado por categoría en un rango de fechas
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
 *         description: Reporte por categorías obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   category:
 *                     type: string
 *                     description: Nombre de la categoría
 *                   total:
 *                     type: number
 *                     description: Total gastado en la categoría
 *             example:
 *               - category: "Comida"
 *                 total: 800.00
 *               - category: "Transporte"
 *                 total: 300.00
 *               - category: "Entretenimiento"
 *                 total: 150.00
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