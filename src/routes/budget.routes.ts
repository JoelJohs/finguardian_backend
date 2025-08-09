import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Budget } from '../entities/Budget';
import { Category } from '../entities/Category';
import { auth, AuthRequest } from '../middlewares/auth';
import { BudgetDTO } from '../dto/BudgetDTO';
import { checkBudgetAlert } from '../services/budget.service';


const router = Router();
const repo = () => AppDataSource.getRepository(Budget);
const catRepo = () => AppDataSource.getRepository(Category);

/**
 * @swagger
 * /api/budgets:
 *   post:
 *     tags: [Budgets]
 *     summary: Crear un nuevo presupuesto
 *     description: Crea un presupuesto para una categoría específica
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BudgetDTO'
 *           example:
 *             limit: 500.00
 *             categoryId: 1
 *             period: "monthly"
 *     responses:
 *       201:
 *         description: Presupuesto creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Budget'
 *       400:
 *         description: Categoría inválida o datos incorrectos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Categoría inválida"
 *       409:
 *         description: Ya existe un presupuesto para esta categoría
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Presupuesto ya existe para esta categoría"
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/budgets
router.post('/', auth, async (req: AuthRequest, res) => {
    const dto: BudgetDTO = req.body;
    const userId = req.userId!;

    // Verificar que la categoría existe
    const category = await catRepo().findOneBy({ id: dto.categoryId });
    if (!category) return res.status(400).json({ error: 'Categoría inválida' });

    // Evitar duplicados (misma categoría + usuario)
    const exists = await repo().findOne({
        where: {
            user: { id: userId },
            category: { id: dto.categoryId }
        }
    });
    if (exists) return res.status(409).json({ error: 'Presupuesto ya existe para esta categoría' });

    const budget = repo().create({
        limit: dto.limit,
        period: dto.period,
        user: { id: userId } as any,
        category: { id: dto.categoryId } as any
    });
    await repo().save(budget);
    res.status(201).json(budget);
});

/**
 * @swagger
 * /api/budgets:
 *   get:
 *     tags: [Budgets]
 *     summary: Obtener presupuestos del usuario
 *     description: Retorna todos los presupuestos del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de presupuestos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Budget'
 *             example:
 *               - id: "123e4567-e89b-12d3-a456-426614174000"
 *                 limit: 500.00
 *                 period: "monthly"
 *                 category:
 *                   id: 1
 *                   name: "Comida"
 *                   type: "expense"
 *                 createdAt: "2024-01-01T00:00:00Z"
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/budgets
router.get('/', auth, async (req: AuthRequest, res) => {
    const budgets = await repo().find({
        where: { user: { id: req.userId! } },
        relations: ['category'],
        order: { createdAt: 'DESC' },
    });
    res.json(budgets);
});


/**
 * @swagger
 * /api/budgets/{categoryId}/almost:
 *   get:
 *     tags: [Budgets]
 *     summary: Verificar alerta de presupuesto
 *     description: Verifica si un presupuesto está cerca del límite o lo ha excedido
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Estado del presupuesto obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 alert:
 *                   type: boolean
 *                   description: Si hay alerta de presupuesto
 *                 overspent:
 *                   type: number
 *                   description: Cantidad excedida (si aplica)
 *                 percentage:
 *                   type: number
 *                   description: Porcentaje usado del presupuesto
 *             example:
 *               alert: true
 *               overspent: 50.00
 *               percentage: 110
 *       404:
 *         description: Presupuesto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Sin presupuesto"
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/budgets/:categoryId/almost 
router.get('/:categoryId/almost', auth, async (req: AuthRequest, res) => {
    const categoryId = Number(req.params.categoryId);
    const budget = await repo().findOne({
        where: {
            user: { id: req.userId! },
            category: { id: categoryId }
        },
    });
    if (!budget) return res.status(404).json({ error: 'Sin presupuesto' });

    const alert = await checkBudgetAlert(req.userId!, categoryId, 0, budget.period as 'monthly' | 'weekly');
    res.json(alert);
});

/**
 * @swagger
 * /api/budgets/{id}:
 *   patch:
 *     tags: [Budgets]
 *     summary: Actualizar límite de presupuesto
 *     description: Actualiza el límite de un presupuesto existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del presupuesto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [limit]
 *             properties:
 *               limit:
 *                 type: number
 *                 format: decimal
 *                 description: Nuevo límite del presupuesto
 *           example:
 *             limit: 750.00
 *     responses:
 *       200:
 *         description: Presupuesto actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Budget'
 *       400:
 *         description: Límite inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Límite inválido"
 *       404:
 *         description: Presupuesto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Presupuesto no encontrado"
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PATCH /api/budgets/:id
router.patch('/:id', auth, async (req: AuthRequest, res) => {
    const { limit } = req.body;
    if (typeof limit !== 'number' || limit <= 0)
        return res.status(400).json({ error: 'Límite inválido' });

    const budget = await repo().findOne({
        where: { id: req.params.id, user: { id: req.userId! } },
    });
    if (!budget) return res.status(404).json({ error: 'Presupuesto no encontrado' });

    budget.limit = limit;
    await repo().save(budget);
    res.json(budget);
});

/**
 * @swagger
 * /api/budgets/{id}:
 *   delete:
 *     tags: [Budgets]
 *     summary: Eliminar presupuesto
 *     description: Elimina un presupuesto existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del presupuesto
 *     responses:
 *       204:
 *         description: Presupuesto eliminado exitosamente
 *       404:
 *         description: Presupuesto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Presupuesto no encontrado"
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// DELETE /api/budgets/:id
router.delete('/:id', auth, async (req: AuthRequest, res) => {
    const result = await repo().delete({
        id: req.params.id,
        user: { id: req.userId! }
    });
    if (result.affected === 0) return res.status(404).json({ error: 'Presupuesto no encontrado' });
    res.status(204).send();
});

export default router;