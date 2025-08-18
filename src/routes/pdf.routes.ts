import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { auth, AuthRequest } from '../middlewares/auth';
import { Transaction } from '../entities/Transaction';
import { User } from '../entities/User';
import { buildTransactionPDF } from '../utils/pdfGenerator';

const router = Router();
const txRepo = () => AppDataSource.getRepository(Transaction);
const userRepo = () => AppDataSource.getRepository(User);

/**
 * @swagger
 * /api/export/pdf:
 *   get:
 *     tags: [Reports]
 *     summary: Exportar transacciones a PDF
 *     description: Exporta las transacciones del usuario en formato PDF para un rango de fechas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: end
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (YYYY-MM-DD)
 *         example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Archivo PDF generado exitosamente
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *             description: "attachment; filename=fin-guardian-{start}-{end}.pdf"
 *       400:
 *         description: Faltan parámetros requeridos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Faltan fechas"
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/export/pdf?start=2024-07-01&end=2024-07-31
router.get('/pdf', auth, async (req: AuthRequest, res) => {
    try {
        const { start, end } = req.query;
        console.log('🔍 Recibiendo request de PDF:', { start, end, userId: req.userId });

        if (!start || !end) {
            console.log('❌ Faltan parámetros de fecha para PDF');
            return res.status(400).json({ error: 'Faltan fechas' });
        }

        const data = await txRepo()
            .createQueryBuilder('t')
            .leftJoinAndSelect('t.category', 'c')
            .leftJoinAndSelect('t.user', 'user')
            .where('user.id = :userId', { userId: req.userId })
            .andWhere('t.created_at BETWEEN :start AND :end', { start, end })
            .orderBy('t.created_at', 'DESC')
            .getMany();

        // Obtener información del usuario
        const user = await userRepo().findOne({
            where: { id: req.userId! }
        });

        const userName = user?.username || 'Usuario';

        // Crear nombre de archivo personalizado
        const safeUserName = userName.replace(/[^a-zA-Z0-9]/g, ''); // Remover caracteres especiales
        const fileName = `report-${safeUserName}-finguardian-${start}-${end}.pdf`;

        console.log('📊 Datos encontrados para PDF:', data.length, 'transacciones');
        console.log('📄 Nombre de archivo:', fileName);

        const doc = buildTransactionPDF(data, userName, start as string, end as string);

        console.log('✅ PDF generado exitosamente');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.error('❌ Error generando PDF:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;