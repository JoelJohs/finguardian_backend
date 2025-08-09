import { Router } from "express";
import { auth, AuthRequest } from "../middlewares/auth";
import { getSummary } from "../services/dashboard.service";

const router = Router();

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Obtener resumen financiero
 *     description: Retorna un resumen de las finanzas del usuario para un período específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month]
 *           default: month
 *         description: Período para el resumen (hoy, semana o mes)
 *     responses:
 *       200:
 *         description: Resumen obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: string
 *                   description: Período solicitado
 *                 summary:
 *                   $ref: '#/components/schemas/DashboardSummary'
 *             example:
 *               period: "month"
 *               summary:
 *                 totalIncome: 3000.00
 *                 totalExpenses: 2500.00
 *                 balance: 500.00
 *                 transactionCount: 45
 *                 categorySummary:
 *                   - category: "Comida"
 *                     total: 800.00
 *                   - category: "Transporte"
 *                     total: 300.00
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /dashboard/summary?period=month|week|today

router.get("/summary", auth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const period = (req.query.period as string) || "month";

  let from = new Date();

  switch (period) {
    case "today":
      from.setHours(0, 0, 0, 0);
      break;
    case "week":
      from.setDate(from.getDate() - 7);
      break;
    case "month":
    default:
      from = new Date(from.getFullYear(), from.getMonth(), 1);
      break;
  }
  const to = new Date();

  const summary = await getSummary(userId, from, to);
  res.json({ period, summary });
});

export default router;
