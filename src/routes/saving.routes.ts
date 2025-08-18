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

  // Validar campos requeridos
  if (!dto.name || !dto.target_amount || !dto.deadline || !dto.frequency) {
    return res.status(400).json({
      message: "Todos los campos son requeridos: name, target_amount, deadline, frequency"
    });
  }

  if (dto.target_amount <= 0) {
    return res.status(400).json({
      message: "El monto objetivo debe ser mayor a 0"
    });
  }

  const newGoal = repo().create({
    name: dto.name,
    target_amount: Number(dto.target_amount),
    deadline: new Date(dto.deadline),
    frequency: dto.frequency,
    current_amount: 0,
    user: { id: userId },
  });

  const savedGoal = await repo().save(newGoal);
  res.status(201).json(savedGoal);
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
 * /api/savings-goals/{id}/recommendation:
 *   get:
 *     tags: [Savings]
 *     summary: Obtener recomendación de ahorro
 *     description: Calcula cuánto debería ahorrar según el progreso actual y tiempo restante
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
 *         description: Recomendación calculada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recommendedAmount:
 *                   type: number
 *                   description: Cantidad recomendada por período
 *                 frequency:
 *                   type: string
 *                   description: Frecuencia de ahorro
 *                 remaining:
 *                   type: number
 *                   description: Cantidad restante para completar
 *                 periodsLeft:
 *                   type: number
 *                   description: Períodos restantes hasta deadline
 *       404:
 *         description: Meta no encontrada
 *       401:
 *         description: Token inválido o no proporcionado
 */
// GET /api/savings-goals/:id/recommendation
router.get("/:id/recommendation", auth, async (req: AuthRequest, res) => {
  const goal = await repo().findOne({
    where: { id: req.params.id, user: { id: req.userId! }, isDeleted: false },
  });

  if (!goal) {
    return res.status(404).json({ message: "Meta no encontrada" });
  }

  const remaining = Number(goal.target_amount) - Number(goal.current_amount);
  const today = new Date();
  const deadline = new Date(goal.deadline);
  const totalDaysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (totalDaysLeft <= 0) {
    return res.json({
      recommendedAmount: 0,
      frequency: goal.frequency,
      remaining: Math.max(0, remaining),
      periodsLeft: 0,
      message: remaining > 0 ? "¡La fecha límite ya pasó!" : "¡Meta completada!"
    });
  }

  if (remaining <= 0) {
    return res.json({
      recommendedAmount: 0,
      frequency: goal.frequency,
      remaining: 0,
      periodsLeft: 0,
      message: "¡Meta completada! 🎉"
    });
  }

  // Calcular períodos restantes según la frecuencia
  let periodsLeft: number;
  let frequencyLabel: string;

  switch (goal.frequency) {
    case 'daily':
      periodsLeft = totalDaysLeft;
      frequencyLabel = 'día';
      break;
    case 'weekly':
      periodsLeft = Math.ceil(totalDaysLeft / 7);
      frequencyLabel = 'semana';
      break;
    case 'biweekly':
      periodsLeft = Math.ceil(totalDaysLeft / 14);
      frequencyLabel = 'quincena';
      break;
    case 'monthly':
      periodsLeft = Math.ceil(totalDaysLeft / 30);
      frequencyLabel = 'mes';
      break;
    default:
      periodsLeft = totalDaysLeft;
      frequencyLabel = 'día';
  }

  // Calcular cantidad recomendada (siempre redondear hacia arriba)
  const recommendedAmount = Math.ceil(remaining / periodsLeft);

  res.json({
    recommendedAmount,
    frequency: goal.frequency,
    frequencyLabel,
    remaining,
    periodsLeft,
    totalDaysLeft,
    message: `Deberías ahorrar $${recommendedAmount.toFixed(2)} cada ${frequencyLabel} para completar tu meta`
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

  // Importar Transaction para calcular balance disponible
  const { Transaction } = await import("../entities/Transaction");
  const transactionRepo = AppDataSource.getRepository(Transaction);

  // Calcular balance total del usuario
  const userTransactions = await transactionRepo.find({
    where: { user: { id: req.userId! } }
  });

  const totalBalance = userTransactions.reduce((total, transaction) => {
    const amount = Number(transaction.amount);
    return transaction.type === 'income'
      ? total + amount
      : total - amount;
  }, 0);

  // Calcular total ahorrado en todas las metas (excluyendo la actual)
  const allGoals = await repo().find({
    where: {
      user: { id: req.userId! },
      isDeleted: false
    }
  });

  const totalSavedOthers = allGoals
    .filter(g => g.id !== goal.id)
    .reduce((total, g) => total + Number(g.current_amount), 0);

  const currentGoalAmount = Number(goal.current_amount);
  const availableToSave = totalBalance - totalSavedOthers - currentGoalAmount;

  if (amount > availableToSave) {
    return res.status(400).json({
      message: `No tienes suficiente dinero disponible. Disponible para ahorrar: $${availableToSave.toFixed(2)}`,
      availableAmount: availableToSave
    });
  }

  // Convertir a números antes de hacer la operación
  const targetAmount = Number(goal.target_amount);
  const newAmount = currentGoalAmount + amount;

  // Verificar que no exceda la meta
  if (newAmount > targetAmount) {
    const maxDeposit = targetAmount - currentGoalAmount;
    return res.status(400).json({
      message: `El depósito excede la meta objetivo. Máximo a depositar: $${maxDeposit.toFixed(2)}`,
      maxAmount: maxDeposit
    });
  }

  goal.current_amount = newAmount;

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
  const currentAmount = Number(goal.current_amount);

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

/**
 * @swagger
 * /api/savings-goals/{id}/mark-used:
 *   patch:
 *     tags: [Savings]
 *     summary: Marcar dinero de meta como utilizado
 *     description: Marca que el dinero ahorrado ya se utilizó para su propósito
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
 *         description: Meta marcada como utilizada exitosamente
 *       404:
 *         description: Meta no encontrada
 *       401:
 *         description: Token inválido o no proporcionado
 */
// PATCH /api/savings-goals/:id/mark-used
router.patch('/:id/mark-used', auth, async (req: AuthRequest, res) => {
  const goal = await repo().findOne({
    where: { id: req.params.id, user: { id: req.userId! }, isDeleted: false },
  });

  if (!goal) {
    return res.status(404).json({ error: 'Meta no encontrada' });
  }

  if (!goal.completedAt) {
    return res.status(400).json({ error: 'Solo se pueden marcar como utilizadas las metas completadas' });
  }

  if (goal.isMoneyUsed) {
    return res.status(400).json({ error: 'Esta meta ya está marcada como utilizada' });
  }

  // Crear transacción de gasto por el dinero utilizado
  const { Transaction } = await import("../entities/Transaction");
  const { Category } = await import("../entities/Category");
  const transactionRepo = AppDataSource.getRepository(Transaction);
  const categoryRepo = AppDataSource.getRepository(Category);

  // Buscar la categoría "Ahorros usados para su propósito"
  const expenseCategory = await categoryRepo.findOne({
    where: { name: "Ahorros usados para su propósito", type: "expense" }
  });

  if (!expenseCategory) {
    return res.status(500).json({ error: 'Categoría de ahorros utilizados no encontrada' });
  }

  // Crear la transacción de gasto
  const expenseTransaction = transactionRepo.create({
    description: `Ahorro utilizado: ${goal.name}`,
    amount: goal.current_amount,
    type: 'expense',
    category: expenseCategory,
    user: { id: req.userId! },
    created_at: new Date()
  });

  await transactionRepo.save(expenseTransaction);

  goal.isMoneyUsed = true;
  await repo().save(goal);

  res.json({
    goal,
    transaction: expenseTransaction,
    message: 'Meta marcada como utilizada y gasto registrado'
  });
});

/**
 * @swagger
 * /api/savings-goals/{id}/delete-and-refund:
 *   delete:
 *     tags: [Savings]
 *     summary: Eliminar meta y liberar dinero
 *     description: Elimina completamente una meta de ahorro y libera el dinero ahorrado para uso general
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
 *         description: Meta eliminada y dinero liberado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 refundedAmount:
 *                   type: number
 *       404:
 *         description: Meta no encontrada
 *       401:
 *         description: Token inválido o no proporcionado
 */
// DELETE /api/savings-goals/:id/delete-and-refund
router.delete('/:id/delete-and-refund', auth, async (req: AuthRequest, res) => {
  const goal = await repo().findOne({
    where: { id: req.params.id, user: { id: req.userId! }, isDeleted: false },
  });

  if (!goal) {
    return res.status(404).json({ error: 'Meta no encontrada' });
  }

  const refundedAmount = Number(goal.current_amount);

  // Marcar como eliminado (soft delete)
  goal.isDeleted = true;
  await repo().save(goal);

  res.json({
    message: 'Meta eliminada exitosamente. El dinero ahorrado está nuevamente disponible.',
    refundedAmount: refundedAmount
  });
});

/**
 * @swagger
 * /api/savings-goals/stats:
 *   get:
 *     tags: [Savings]
 *     summary: Obtener estadísticas de ahorro
 *     description: Obtiene estadísticas generales de las metas de ahorro del usuario
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalGoals:
 *                   type: number
 *                   description: Total de metas de ahorro
 *                 completedGoals:
 *                   type: number
 *                   description: Metas completadas
 *                 totalSaved:
 *                   type: number
 *                   description: Total ahorrado
 *                 totalTargetAmount:
 *                   type: number
 *                   description: Total de metas objetivo
 *                 totalBalance:
 *                   type: number
 *                   description: Balance total del usuario
 *                 availableToSpend:
 *                   type: number
 *                   description: Dinero disponible para gastar
 */
// GET /api/savings-goals/stats
router.get("/stats", auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const savingsGoalRepo = AppDataSource.getRepository(SavingsGoal);

    // Importar Transaction aquí para evitar dependencias circulares
    const { Transaction } = await import("../entities/Transaction");
    const transactionRepo = AppDataSource.getRepository(Transaction);

    // Obtener todas las metas
    const goals = await savingsGoalRepo.find({
      where: {
        user: { id: userId },
        isDeleted: false
      }
    });

    // Calcular estadísticas
    const totalGoals = goals.length;
    const completedGoals = goals.filter(goal => goal.completedAt).length;
    const totalSaved = goals.reduce((total, goal) => total + Number(goal.current_amount), 0);
    const totalTargetAmount = goals.reduce((total, goal) => total + Number(goal.target_amount), 0);

    // Calcular balance total del usuario
    const userTransactions = await transactionRepo.find({
      where: { user: { id: userId } }
    });

    const totalBalance = userTransactions.reduce((total, transaction) => {
      const amount = Number(transaction.amount);
      return transaction.type === 'income'
        ? total + amount
        : total - amount;
    }, 0);

    const availableToSpend = totalBalance - totalSaved;

    res.json({
      totalGoals,
      completedGoals,
      totalSaved,
      totalTargetAmount,
      totalBalance,
      availableToSpend,
      savingsPercentage: totalTargetAmount > 0 ? (totalSaved / totalTargetAmount) * 100 : 0
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

export default router;
