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

// GET /api/budgets
router.get('/', auth, async (req: AuthRequest, res) => {
    const budgets = await repo().find({
        where: { user: { id: req.userId! } },
        relations: ['category'],
        order: { createdAt: 'DESC' },
    });
    res.json(budgets);
});


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