// src/routes/report.routes.ts
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { auth, AuthRequest } from '../middlewares/auth';
import { Between } from 'typeorm';
import { Transaction } from '../entities/Transaction';
import { AIAnalysisService } from '../services/ai-analysis.service';
import pdfParse from 'pdf-parse';
import multer from 'multer';
import PDFDocument from 'pdfkit';

const router = Router();
const txRepo = () => AppDataSource.getRepository(Transaction);

// Configurar multer para manejar archivos PDF
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req: any, file: any, cb: any) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB máximo
    }
});

// Endpoint de prueba simple
router.get('/test', auth, async (req: AuthRequest, res) => {
    console.log('🔍 Test endpoint llamado por usuario:', req.userId);
    try {
        const count = await txRepo().count({ where: { user: { id: req.userId } } });
        console.log('✅ Conteo de transacciones:', count);
        res.json({
            message: 'Endpoint de reportes funcionando',
            userId: req.userId,
            transactionCount: count
        });
    } catch (error) {
        console.error('❌ Error en test endpoint:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint de prueba para verificar autenticación
router.get('/test', auth, async (req: AuthRequest, res) => {
    console.log('🧪 Test endpoint llamado, userId:', req.userId);

    // Contar transacciones del usuario
    const count = await txRepo()
        .createQueryBuilder('t')
        .where('t.userId = :userId', { userId: req.userId })
        .getCount();

    console.log('📊 Transacciones encontradas:', count);

    res.json({
        message: 'Endpoint funcionando',
        userId: req.userId,
        transactionCount: count,
        timestamp: new Date().toISOString()
    });
});

/**
 * @swagger
 * /api/reports/trend:
 *   get:
 *     tags: [Reports]
 *     summary: Obtener tendencia de ingresos y gastos
 *     description: Retorna la tendencia diaria de ingresos y gastos en un rango de fechas
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
 *         description: Tendencia obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date
 *                     description: Fecha del día
 *                   income:
 *                     type: number
 *                     description: Total de ingresos del día
 *                   expense:
 *                     type: number
 *                     description: Total de gastos del día
 *             example:
 *               - date: "2024-01-15"
 *                 income: 500.00
 *                 expense: 300.00
 *               - date: "2024-01-16"
 *                 income: 0.00
 *                 expense: 150.00
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
// GET /api/reports/trend?start=2024-07-01&end=2024-07-31
router.get('/trend', auth, async (req: AuthRequest, res) => {
    try {
        const { start, end } = req.query;
        console.log('🔍 Recibiendo request de tendencias:', { start, end, userId: req.userId });

        if (!start || !end) {
            console.log('❌ Faltan parámetros de fecha');
            return res.status(400).json({ error: 'Faltan fechas' });
        }

        const raw = await txRepo()
            .createQueryBuilder('t')
            .select("DATE_TRUNC('day', t.created_at)", 'day')
            .addSelect('SUM(CASE WHEN t.type = :income THEN t.amount ELSE 0 END)', 'income')
            .addSelect('SUM(CASE WHEN t.type = :expense THEN t.amount ELSE 0 END)', 'expense')
            .where('t.user = :userId', { userId: req.userId })
            .andWhere('t.created_at BETWEEN :start AND :end', { start, end })
            .groupBy('day')
            .orderBy('day')
            .setParameters({ income: 'income', expense: 'expense' })
            .getRawMany();

        console.log('📊 Datos raw de BD:', raw);

        const trend = raw.map(r => ({
            date: r.day.split('T')[0],
            income: parseFloat(r.income),
            expense: parseFloat(r.expense),
            balance: parseFloat(r.income) - parseFloat(r.expense)
        }));

        console.log('✅ Tendencias procesadas:', trend);
        res.json(trend);
    } catch (error) {
        console.error('❌ Error en endpoint de tendencias:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * @swagger
 * /api/reports/category:
 *   get:
 *     tags: [Reports]
 *     summary: Obtener reporte de gastos por categoría
 *     description: Retorna el total de gastos agrupado por categoría en un rango de fechas
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
 *         description: Reporte por categorías obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   category:
 *                     type: string
 *                     description: Nombre de la categoría
 *                   total:
 *                     type: number
 *                     description: Total gastado en la categoría
 *             example:
 *               - category: "Comida"
 *                 total: 800.00
 *               - category: "Transporte"
 *                 total: 300.00
 *               - category: "Entretenimiento"
 *                 total: 150.00
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
// GET /api/reports/category?start=2024-07-01&end=2024-07-31
router.get('/category', auth, async (req: AuthRequest, res) => {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ error: 'Faltan fechas' });

    const raw = await txRepo()
        .createQueryBuilder('t')
        .select('c.name', 'category')
        .addSelect('SUM(t.amount)', 'total')
        .leftJoin('t.category', 'c')
        .where('t.userId = :userId', { userId: req.userId })
        .andWhere('t.type = :type', { type: 'expense' })
        .andWhere('t.created_at BETWEEN :start AND :end', { start, end })
        .groupBy('c.name')
        .orderBy('total', 'DESC')
        .getRawMany();

    const category = raw.map(r => ({
        category: r.category,
        total: parseFloat(r.total),
    }));
    res.json(category);
});

/**
 * @swagger
 * /api/reports/ai-analysis:
 *   post:
 *     tags: [Reports]
 *     summary: Generar análisis de IA a partir de un PDF de reporte
 *     description: Sube un PDF de reporte financiero y recibe un análisis inteligente con consejos personalizados
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               pdf:
 *                 type: string
 *                 format: binary
 *                 description: Archivo PDF del reporte financiero
 *     responses:
 *       200:
 *         description: Análisis de IA generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indica si el análisis fue exitoso
 *                 analysis:
 *                   type: string
 *                   description: Análisis detallado generado por IA
 *                 extractedData:
 *                   type: object
 *                   description: Datos extraídos del PDF
 *             example:
 *               success: true
 *               analysis: "Análisis Financiero Inteligente para Juan..."
 *               extractedData:
 *                 userName: "Juan Pérez"
 *                 period: "01/01/2024 al 31/01/2024"
 *                 financialSummary:
 *                   totalIncomes: 5000.00
 *                   totalExpenses: 3500.00
 *                   balance: 1500.00
 *       400:
 *         description: No se proporcionó archivo PDF o formato inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "No se proporcionó un archivo PDF"
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/ai-analysis', auth, upload.single('pdf'), async (req: AuthRequest, res) => {
    try {
        console.log('🤖 Iniciando análisis de IA del PDF, userId:', req.userId);

        // Verificar que se haya subido un archivo
        if (!req.file) {
            console.log('❌ No se proporcionó archivo PDF');
            return res.status(400).json({ error: 'No se proporcionó un archivo PDF' });
        }

        console.log('📄 Archivo PDF recibido:', {
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });

        // Extraer texto del PDF
        const pdfData = await pdfParse(req.file.buffer);
        const pdfText = pdfData.text;

        console.log('📝 Texto extraído del PDF (primeros 500 caracteres):', pdfText.substring(0, 500));

        // Verificar que el PDF contiene datos financieros válidos
        if (!pdfText.includes('FinGuardian') || !pdfText.includes('Reporte Financiero')) {
            console.log('❌ PDF no válido - no contiene datos de FinGuardian');
            return res.status(400).json({
                error: 'El archivo PDF no parece ser un reporte válido de FinGuardian'
            });
        }

        // Extraer datos del PDF
        const extractedData = AIAnalysisService.extractDataFromPDF(pdfText);
        console.log('📊 Datos extraídos del PDF:', extractedData);

        // Generar análisis de IA
        const intelligentAnalysis = AIAnalysisService.generateIntelligentAnalysis(extractedData);
        console.log('🧠 Análisis de IA generado exitosamente');

        res.json({
            success: true,
            analysis: intelligentAnalysis,
            extractedData: extractedData,
            metadata: {
                fileName: req.file.originalname,
                fileSize: req.file.size,
                processedAt: new Date().toISOString(),
                userId: req.userId
            }
        });

    } catch (error) {
        console.error('❌ Error en análisis de IA del PDF:', error);

        // Manejar errores específicos
        if (error instanceof Error) {
            if (error.message.includes('PDF')) {
                return res.status(400).json({
                    error: 'Error al procesar el archivo PDF. Asegúrate de que sea un PDF válido.'
                });
            }
            if (error.message.includes('Solo se permiten archivos PDF')) {
                return res.status(400).json({
                    error: 'Solo se permiten archivos PDF'
                });
            }
        }

        res.status(500).json({
            error: 'Error interno del servidor al procesar el análisis de IA'
        });
    }
});

/*
// Endpoint deshabilitado - PDF de análisis de IA
router.post('/ai-analysis-pdf', auth, async (req: AuthRequest, res) => {
    res.status(404).json({ error: 'Funcionalidad deshabilitada temporalmente' });
});
*/
/*
// Resto del código del endpoint deshabilitado
        const { analysis, extractedData, originalFileName } = req.body;

        if (!analysis) {
            return res.status(400).json({ error: 'El análisis es requerido' });
        }

        // Obtener información del usuario
        const userRepo = AppDataSource.getRepository('User');
        const user = await userRepo.findOne({
            where: { id: req.userId! }
        });

        const userName = extractedData?.userName || user?.username || 'Usuario';

        // Crear PDF del análisis de IA
        const doc = generateAIAnalysisPDF(analysis, extractedData, userName, originalFileName);

        // Crear nombre de archivo personalizado
        const safeUserName = userName.replace(/[^a-zA-Z0-9]/g, '');
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `analisis-ia-${safeUserName}-${timestamp}.pdf`;

        console.log('🧠 PDF de análisis de IA generado para:', userName);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        doc.pipe(res);
        doc.end();

    } catch (error) {
        console.error('❌ Error generando PDF de análisis de IA:', error);
        res.status(500).json({
            error: 'Error interno del servidor al generar el PDF del análisis'
        });
    }
});

// Función para generar PDF del análisis de IA
function generateAIAnalysisPDF(
    analysis: string,
    extractedData: any,
    userName: string,
    originalFileName?: string
): PDFKit.PDFDocument {
    const doc = new PDFDocument({
        margin: 40,
        size: 'A4'
    });

    const primaryColor = '#6366f1'; // Indigo
    const secondaryColor = '#64748b'; // Gris

    // Header
    doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);

    doc.fillColor('white')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Analisis Financiero Inteligente', 40, 30);

    doc.fontSize(14)
        .font('Helvetica')
        .text('Generado por FinGuardian AI', 40, 60);

    let currentY = 130;

    // Información del usuario y archivo
    doc.fillColor('#1f2937')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(`Análisis para: ${userName}`, 40, currentY);

    currentY += 25;

    if (originalFileName) {
        doc.fontSize(12)
            .font('Helvetica')
            .fillColor('#6b7280')
            .text(`Archivo analizado: ${originalFileName}`, 40, currentY);
        currentY += 20;
    }

    doc.fontSize(12)
        .text(`Fecha de análisis: ${new Date().toLocaleDateString()}`, 40, currentY);

    currentY += 40;

    // Datos extraídos (si están disponibles)
    if (extractedData) {
        doc.fontSize(14)
            .font('Helvetica-Bold')
            .fillColor(primaryColor)
            .text('RESUMEN DE DATOS ANALIZADOS', 40, currentY);

        currentY += 20;

        if (extractedData.period) {
            doc.fontSize(11)
                .font('Helvetica')
                .fillColor('#374151')
                .text(`Período: ${extractedData.period}`, 40, currentY);
            currentY += 15;
        }

        if (extractedData.financialSummary) {
            const fs = extractedData.financialSummary;
            if (fs.totalIncomes !== undefined) {
                doc.text(`Ingresos totales: $${fs.totalIncomes.toFixed(2)}`, 40, currentY);
                currentY += 15;
            }
            if (fs.totalExpenses !== undefined) {
                doc.text(`Gastos totales: $${fs.totalExpenses.toFixed(2)}`, 40, currentY);
                currentY += 15;
            }
            if (fs.balance !== undefined) {
                doc.text(`Balance: $${fs.balance.toFixed(2)}`, 40, currentY);
                currentY += 15;
            }
        }

        currentY += 20;
    }

    // Análisis de IA
    doc.fontSize(14)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('ANALISIS INTELIGENTE', 40, currentY);

    currentY += 20;

    // Procesar y formatear el análisis
    const analysisLines = analysis.split('\\n').filter(line => line.trim() !== '');

    for (const line of analysisLines) {
        if (currentY > doc.page.height - 100) {
            doc.addPage();
            currentY = 40;
        }

        const trimmedLine = line.trim();

        if (trimmedLine === '' || trimmedLine.includes('===')) {
            currentY += 10;
            continue;
        }

        // Títulos principales (líneas que terminan en dos puntos)
        if (trimmedLine.endsWith(':') && !trimmedLine.includes('•') && trimmedLine.length < 50) {
            doc.fontSize(13)
                .font('Helvetica-Bold')
                .fillColor('#1f2937')
                .text(trimmedLine.replace(':', ''), 40, currentY);
            currentY += 20;
        }
        // Subtítulos (líneas que empiezan con mayúscula y contienen keywords)
        else if (trimmedLine.match(/^[A-Z]/) && (trimmedLine.includes('CONSEJO') || trimmedLine.includes('RECOMEND') || trimmedLine.includes('ANALISIS') || trimmedLine.includes('PROYECC'))) {
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .fillColor('#4338ca')
                .text(trimmedLine, 40, currentY);
            currentY += 18;
        }
        // Elementos de lista
        else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
            doc.fontSize(10)
                .font('Helvetica')
                .fillColor('#374151')
                .text(trimmedLine, 50, currentY, {
                    width: doc.page.width - 90
                });
            const lineHeight = doc.heightOfString(trimmedLine, {
                width: doc.page.width - 90
            });
            currentY += lineHeight + 5;
        }
        // Texto normal
        else {
            doc.fontSize(10)
                .font('Helvetica')
                .fillColor('#374151')
                .text(trimmedLine, 40, currentY, {
                    width: doc.page.width - 80
                });
            const lineHeight = doc.heightOfString(trimmedLine, {
                width: doc.page.width - 80
            });
            currentY += lineHeight + 8;
        }
    }

    // Footer
    const footerY = doc.page.height - 40;
    doc.fontSize(8)
        .fillColor(secondaryColor)
        .text('Analisis generado por FinGuardian AI - Este analisis es informativo y no constituye asesoria financiera profesional', 40, footerY, {
            width: doc.page.width - 80,
            align: 'center'
        });

    return doc;
}
*/

export default router;