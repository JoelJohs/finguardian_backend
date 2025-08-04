import { Router } from "express";
import { AppDataSource } from "../config/database";
import { Transaction } from "../entities/Transaction";
import { Category } from "../entities/Category";
import { auth, AuthRequest } from "../middlewares/auth";
import { TransactionDTO } from "../dto/transaccionDTO";
import { checkBudgetAlert } from "../services/budget.service";
import { enqueue } from "../services/notification.service";

const router = Router();
const repo = () => AppDataSource.getRepository(Transaction);
const categoryRepo = () => AppDataSource.getRepository(Category);

// POST /transactions
router.post("/", auth, async (req: AuthRequest, res) => {
  const dto: TransactionDTO = req.body;
  const userId = req.userId!;

  const category = await categoryRepo().findOneBy({ id: dto.categoryId });
  if (!category) return res.status(400).json({ error: "Categoría inválida" });

  // Crear y guardar la transacción primero
  const tx = repo().create({ ...dto, user: { id: userId }, category });
  await repo().save(tx);

  // Verificar alerta de presupuesto después de guardar
  const alert = await checkBudgetAlert(userId, dto.categoryId, dto.amount, 'monthly');

  // Encolar notificación si hay alerta
  if (alert?.alert) {
    enqueue(
      userId,
      `¡Te pasaste $${alert.overspent} del presupuesto en ${category.name}!`,
      'budget_overspent'
    );
  }

  // Siempre responder con la transacción y la alerta (si existe)
  res.status(201).json({ tx, alert });
});

// GET /transactions (paginado)
router.get("/", auth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;

  const [data, total] = await repo().findAndCount({
    where: { user: { id: userId } },
    relations: ["category"],
    order: { created_at: "DESC" },
    skip: (page - 1) * limit,
    take: limit,
  });

  res.json({
    data,
    total,
    page,
    lastPage: Math.ceil(total / limit),
  });
});

// GET /transactions/:id
router.get("/:id", auth, async (req: AuthRequest, res) => {
  const tx = await repo().findOne({
    where: { id: req.params.id, user: { id: req.userId! } },
    relations: ["category"],
  });

  if (!tx) {
    return res.status(404).json({ error: "Transacción no encontrada" });
  }

  res.json(tx);
});

// PATCH /transactions/:id
router.patch("/:id", auth, async (req: AuthRequest, res) => {
  const tx = await repo().findOne({
    where: { id: req.params.id, user: { id: req.userId! } },
    relations: ["category"],
  });

  if (!tx) {
    return res.status(404).json({ error: "Transacción no encontrada" });
  }

  repo().merge(tx, req.body);
  await repo().save(tx);

  res.json(tx);
});

// DELETE /transactions/:id
router.delete("/:id", auth, async (req: AuthRequest, res) => {
  const result = await repo().delete({
    id: req.params.id,
    user: { id: req.userId! },
  });
  if (result.affected === 0)
    return res.status(404).json({ error: "No encontrado" });
  res.status(204).send();
});

// Exportar el router
export default router;
