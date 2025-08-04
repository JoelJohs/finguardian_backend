import { Router } from "express";
import { AppDataSource } from "../config/database";
import { SavingsGoal } from "../entities/SavingsGoal";
import { auth, AuthRequest } from "../middlewares/auth";
import { calculateRequiredSaving } from "../services/saving.service";
import { addToLifetime } from "../services/lifetime.service";
import { enqueue } from "../services/notification.service";

const router = Router();
const repo = () => AppDataSource.getRepository(SavingsGoal);

// POST /api/savings-goals
router.post("/", auth, async (req: AuthRequest, res) => {
  const dto = req.body;
  const userId = req.userId!;

  const newGoal = repo().create({
    ...dto,
    user: { id: userId },
    target_amount: dto.targetAmount,
    deadline: dto.deadline,
  });

  await repo().save(newGoal);
  res.status(201).json(newGoal);
});

// GET /api/savings-goals
router.get("/", auth, async (req: AuthRequest, res) => {
  const goals = await repo().find({
    where: { user: { id: req.userId! } },
    order: { created_at: "DESC" },
  });
  res.json(goals);
});

// GET /api/savings-goals/:id/progress
router.get("/:id/progress", auth, async (req: AuthRequest, res) => {
  const goal = await repo().findOne({
    where: { id: req.params.id, user: { id: req.userId! } },
  });

  if (!goal) {
    return res.status(404).json({ message: "Meta no encontrada" });
  }

  const remaining = goal.target_amount - goal.current_amount;
  const daysLeft = Math.ceil(
    (goal.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  const required = calculateRequiredSaving(
    remaining,
    daysLeft,
    goal.frequency as "daily" | "weekly" | "biweekly" | "monthly"
  );

  res.json({
    ...goal,
    remaining,
    daysLeft,
    requiredPerPeriod: required,
  });
});

// PATCH /api/savings-goals/:id/deposit
router.patch("/:id/deposit", auth, async (req: AuthRequest, res) => {
  const { amount } = req.body;

  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ message: "Monto inválido" });
  }

  const goal = await repo().findOne({
    where: { id: req.params.id, user: { id: req.userId! } },
  });
  if (!goal) {
    return res.status(404).json({ message: "Meta no encontrada" });
  }

  // Convertir a números antes de hacer la operación
  const currentAmount = parseFloat(goal.current_amount.toString());
  const targetAmount = parseFloat(goal.target_amount.toString());

  goal.current_amount = Math.min(currentAmount + amount, targetAmount);

  // Verificar si se completó la meta
  if (goal.current_amount >= targetAmount && !goal.completedAt) {
    goal.completedAt = new Date();
    await addToLifetime(req.userId!, targetAmount);

    // Encolar notificación de meta completada
    enqueue(req.userId!, `¡Meta "${goal.name}" completada! 🎉`, 'goal_completed');
  }

  const savedGoal = await repo().save(goal);

  res.json(savedGoal);
});

// PATCH /api/savings-goals/:id/withdraw

router.patch('/:id/withdraw', auth, async (req: AuthRequest, res) => {
  const { amount } = req.body;
  if (typeof amount !== 'number' || amount <= 0)
    return res.status(400).json({ error: 'Monto inválido' });

  const goal = await repo().findOne({
    where: { id: req.params.id, user: { id: req.userId! }, isDeleted: false },
  });
  if (!goal) return res.status(404).json({ error: 'Meta no encontrada' });

  // Convertir a números antes de hacer la operación
  const currentAmount = parseFloat(goal.current_amount.toString());

  if (currentAmount < amount)
    return res.status(409).json({ error: 'Fondos insuficientes' });

  goal.current_amount = currentAmount - amount;
  await repo().save(goal);
  res.json(goal);
});

// DELETE /api/savings-goals/:id

router.delete('/:id', auth, async (req: AuthRequest, res) => {
  const goal = await repo().findOne({
    where: { id: req.params.id, user: { id: req.userId! }, isDeleted: false },
  });
  if (!goal) return res.status(404).json({ error: 'Meta no encontrada' });

  goal.isDeleted = true;
  await repo().save(goal);
  res.status(204).send();
});

export default router;
