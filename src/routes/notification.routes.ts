import { Router } from 'express';
import { auth, AuthRequest } from '../middlewares/auth';
import { getNotifications, clear } from '../services/notification.service';

const router = Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Obtener notificaciones del usuario
 *     description: Retorna todas las notificaciones pendientes del usuario
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de notificaciones obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: ID único de la notificación
 *                   message:
 *                     type: string
 *                     description: Mensaje de la notificación
 *                   type:
 *                     type: string
 *                     description: Tipo de notificación
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     description: Fecha y hora de la notificación
 *             example:
 *               - id: "notif-123"
 *                 message: "¡Te pasaste $50 del presupuesto en Comida!"
 *                 type: "budget_overspent"
 *                 timestamp: "2024-01-15T10:30:00Z"
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/notifications
router.get('/', auth, (req: AuthRequest, res) => {
    const list = getNotifications(req.userId!);
    res.json(list);
});

/**
 * @swagger
 * /api/notifications:
 *   delete:
 *     tags: [Notifications]
 *     summary: Marcar notificaciones como leídas
 *     description: Elimina todas las notificaciones pendientes del usuario
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Notificaciones marcadas como leídas exitosamente
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// DELETE /api/notifications  (marcar como leídas)
router.delete('/', auth, (req: AuthRequest, res) => {
    clear(req.userId!);
    res.status(204).send();
});

export default router;