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

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     tags: [Transactions]
 *     summary: Crear una nueva transacción
 *     description: Crea una nueva transacción y verifica alertas de presupuesto
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransactionDTO'
 *           example:
 *             amount: 50.99
 *             categoryId: 1
 *             description: "Almuerzo en restaurante"
 *             type: "expense"
 *     responses:
 *       201:
 *         description: Transacción creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tx:
 *                   $ref: '#/components/schemas/Transaction'
 *                 alert:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     alert: { type: 'boolean' }
 *                     overspent: { type: 'number' }
 *       400:
 *         description: Categoría inválida o datos incorrectos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: Obtener transacciones del usuario
 *     description: Retorna una lista paginada de transacciones del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número de elementos por página
 *     responses:
 *       200:
 *         description: Lista de transacciones obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 total:
 *                   type: integer
 *                   description: Total de transacciones
 *                 page:
 *                   type: integer
 *                   description: Página actual
 *                 lastPage:
 *                   type: integer
 *                   description: Última página disponible
 *             example:
 *               data:
 *                 - id: "123e4567-e89b-12d3-a456-426614174000"
 *                   amount: 50.99
 *                   description: "Almuerzo en restaurante"
 *                   type: "expense"
 *                   category:
 *                     id: 1
 *                     name: "Comida"
 *                     type: "expense"
 *                   createdAt: "2024-01-15T10:30:00Z"
 *               total: 150
 *               page: 1
 *               lastPage: 3
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     tags: [Transactions]
 *     summary: Obtener una transacción específica
 *     description: Retorna los detalles de una transacción específica del usuario
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la transacción
 *     responses:
 *       200:
 *         description: Transacción obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *             example:
 *               id: "123e4567-e89b-12d3-a456-426614174000"
 *               amount: 50.99
 *               description: "Almuerzo en restaurante"
 *               type: "expense"
 *               category:
 *                 id: 1
 *                 name: "Comida"
 *                 type: "expense"
 *               createdAt: "2024-01-15T10:30:00Z"
 *       404:
 *         description: Transacción no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Transacción no encontrada"
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/transactions/{id}:
 *   patch:
 *     tags: [Transactions]
 *     summary: Actualizar una transacción
 *     description: Actualiza los datos de una transacción existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la transacción
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 format: decimal
 *                 description: Nuevo monto de la transacción
 *               description:
 *                 type: string
 *                 description: Nueva descripción
 *               categoryId:
 *                 type: integer
 *                 description: Nueva categoría
 *           example:
 *             amount: 75.50
 *             description: "Cena en restaurante (actualizado)"
 *             categoryId: 1
 *     responses:
 *       200:
 *         description: Transacción actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: Transacción no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Transacción no encontrada"
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     tags: [Transactions]
 *     summary: Eliminar una transacción
 *     description: Elimina una transacción existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la transacción
 *     responses:
 *       204:
 *         description: Transacción eliminada exitosamente
 *       404:
 *         description: Transacción no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "No encontrado"
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
