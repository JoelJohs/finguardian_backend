import { Router } from 'express';
import { auth, AuthRequest } from '../middlewares/auth';
import { getLifetime } from '../services/lifetime.service';

const router = Router();

/**
 * @swagger
 * /api/lifetime:
 *   get:
 *     tags: [Lifetime]
 *     summary: Obtener ahorros de por vida
 *     description: Retorna el total de ahorros acumulados de por vida del usuario
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ahorros de por vida obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: ID único del registro
 *                 totalSaved:
 *                   type: number
 *                   format: decimal
 *                   description: Total ahorrado de por vida
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *                   description: Última actualización
 *             example:
 *               id: "123e4567-e89b-12d3-a456-426614174000"
 *               totalSaved: 15750.00
 *               lastUpdated: "2024-01-15T10:30:00Z"
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', auth, async (req: AuthRequest, res) => {
    const data = await getLifetime(req.userId!);
    res.json(data);
});

export default router;