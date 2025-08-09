import { Router } from "express";
import { AppDataSource } from "../config/database";
import { SavingsGoal } from "../entities/SavingsGoal";
import { auth, AuthRequest } from "../middlewares/auth";
import { calculateRequiredSaving } from "../services/saving.service";
import { addToLifetime } from "../services/lifetime.service";
import { enqueue } from "../services/notification.service";

const router = Router();
const repo = () => AppDataSource.getRepository(SavingsGoal);

/**
 * @swagger
 * /api/savings-goals:
 *   post:
 *     tags: [Savings]
 *     summary: Crear una nueva meta de ahorro
 *     description: Crea una nueva meta de ahorro para el usuario
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SavingsGoalDTO'
 *           example:
 *             name: "Vacaciones en Europa"
 *             target: 3000.00
 *             deadline: "2024-12-31"
 *     responses:
 *       201:
 *         description: Meta de ahorro creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SavingsGoal'
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/savings-goals:
 *   get:
 *     tags: [Savings]
 *     summary: Obtener metas de ahorro del usuario
 *     description: Retorna todas las metas de ahorro del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de metas de ahorro obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SavingsGoal'
 *             example:
 *               - id: "123e4567-e89b-12d3-a456-426614174000"
 *                 name: "Vacaciones en Europa"
 *                 target: 3000.00
 *                 current: 750.00
 *                 deadline: "2024-12-31"
 *                 createdAt: "2024-01-01T00:00:00Z"
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/savings-goals
router.get("/", auth, async (req: AuthRequest, res) => {
  const goals = await repo().find({
    where: { user: { id: req.userId! } },
    order: { created_at: "DESC" },
  });
  res.json(goals);
});

/**
 * @swagger
 * /api/savings-goals/{id}/progress:
 *   get:
 *     tags: [Savings]
 *     summary: Obtener progreso de una meta de ahorro
 *     description: Retorna el progreso detallado de una meta de ahorro específica
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la meta de ahorro
 *     responses:
 *       200:
 *         description: Progreso de la meta obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 goal:
 *                   $ref: '#/components/schemas/SavingsGoal'
 *                 remaining:
 *                   type: number
 *                   description: Cantidad restante para alcanzar la meta
 *                 daysLeft:
 *                   type: integer
 *                   description: Días restantes hasta la fecha límite
 *                 requiredDaily:
 *                   type: number
 *                   description: Cantidad diaria requerida para alcanzar la meta
 *                 percentage:
 *                   type: number
 *                   description: Porcentaje completado de la meta
 *             example:
 *               goal:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 name: "Vacaciones en Europa"
 *                 target: 3000.00
 *                 current: 750.00
 *                 deadline: "2024-12-31"
 *               remaining: 2250.00
 *               daysLeft: 180
 *               requiredDaily: 12.50
 *               percentage: 25.0
 *       404:
 *         description: Meta no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Meta no encontrada"
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/savings-goals/{id}/deposit:
 *   patch:
 *     tags: [Savings]
 *     summary: Realizar depósito en meta de ahorro
 *     description: Agrega dinero a una meta de ahorro específica
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la meta de ahorro
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0.01
 *                 description: Monto a depositar
 *           example:
 *             amount: 100.00
 *     responses:
 *       200:
 *         description: Depósito realizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 goal:
 *                   $ref: '#/components/schemas/SavingsGoal'
 *                 message:
 *                   type: string
 *                   description: Mensaje de confirmación
 *             example:
 *               goal:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 name: "Vacaciones en Europa"
 *                 target: 3000.00
 *                 current: 850.00
 *                 deadline: "2024-12-31"
 *               message: "¡Meta alcanzada! Se agregó al ahorro de por vida."
 *       400:
 *         description: Monto inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Monto inválido"
 *       404:
 *         description: Meta no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Meta no encontrada"
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/savings-goals/{id}/withdraw:
 *   patch:
 *     tags: [Savings]
 *     summary: Realizar retiro de meta de ahorro
 *     description: Retira dinero de una meta de ahorro específica
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la meta de ahorro
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0.01
 *                 description: Monto a retirar
 *           example:
 *             amount: 50.00
 *     responses:
 *       200:
 *         description: Retiro realizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SavingsGoal'
 *       400:
 *         description: Monto inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Monto inválido"
 *       404:
 *         description: Meta no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Meta no encontrada"
 *       409:
 *         description: Fondos insuficientes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Fondos insuficientes"
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/savings-goals/{id}:
 *   delete:
 *     tags: [Savings]
 *     summary: Eliminar meta de ahorro
 *     description: Elimina una meta de ahorro existente (soft delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la meta de ahorro
 *     responses:
 *       204:
 *         description: Meta eliminada exitosamente
 *       404:
 *         description: Meta no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Meta no encontrada"
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
