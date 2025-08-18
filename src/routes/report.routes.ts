// src/routes/report.routes.ts
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { auth, AuthRequest } from '../middlewares/auth';
import { Between } from 'typeorm';
import { Transaction } from '../entities/Transaction';
import { Budget } from '../entities/Budget';
import { SavingsGoal } from '../entities/SavingsGoal';
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

/**
 * @swagger
 * /api/reports/category-analysis:
 *   get:
 *     tags: [Reports]
 *     summary: Obtener análisis detallado por categorías
 *     description: Retorna análisis completo de gastos por categoría con porcentajes y comparaciones
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
 *       - in: query
 *         name: end
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Análisis por categorías obtenido exitosamente
 */
router.get('/category-analysis', auth, async (req: AuthRequest, res) => {
    try {
        const { start, end } = req.query;
        if (!start || !end) {
            return res.status(400).json({ error: 'Faltan fechas' });
        }

        // Obtener gastos por categoría
        const categoryRaw = await txRepo()
            .createQueryBuilder('t')
            .select('c.name', 'name')
            .addSelect('c.color', 'color')
            .addSelect('SUM(t.amount)', 'amount')
            .addSelect('COUNT(t.id)', 'transactionCount')
            .leftJoin('t.category', 'c')
            .where('t.userId = :userId', { userId: req.userId })
            .andWhere('t.type = :type', { type: 'expense' })
            .andWhere('t.created_at BETWEEN :start AND :end', { start, end })
            .groupBy('c.name, c.color')
            .orderBy('amount', 'DESC')
            .getRawMany();

        const totalAmount = categoryRaw.reduce((sum, cat) => sum + parseFloat(cat.amount), 0);

        const categories = categoryRaw.map(cat => ({
            name: cat.name || 'Sin categoría',
            amount: parseFloat(cat.amount),
            percentage: totalAmount > 0 ? (parseFloat(cat.amount) / totalAmount * 100) : 0,
            color: cat.color || '#6b7280',
            transactionCount: parseInt(cat.transactionCount)
        }));

        // Generar insights
        const topCategory = categories.length > 0 ? categories[0] : null;
        const insights = [];

        if (topCategory) {
            insights.push(`Tu mayor gasto es en ${topCategory.name} con $${topCategory.amount.toFixed(2)} (${topCategory.percentage.toFixed(1)}%)`);
        }

        if (categories.length > 0) {
            const smallCategories = categories.filter(cat => cat.percentage < 5);
            if (smallCategories.length > 0) {
                insights.push(`Tienes ${smallCategories.length} categorías con gastos menores al 5%`);
            }
        }

        const response = {
            categories,
            totalAmount,
            insights,
            period: { start, end },
            summary: {
                totalCategories: categories.length,
                averagePerCategory: categories.length > 0 ? totalAmount / categories.length : 0
            }
        };

        res.json(response);
    } catch (error) {
        console.error('❌ Error en category-analysis:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * @swagger
 * /api/reports/monthly-comparison:
 *   get:
 *     tags: [Reports]
 *     summary: Obtener comparación mensual de finanzas
 *     description: Compara los últimos meses de ingresos, gastos y balance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comparación mensual obtenida exitosamente
 */
router.get('/monthly-comparison', auth, async (req: AuthRequest, res) => {
    try {
        // Obtener datos de los últimos 6 meses
        const monthsData = await txRepo()
            .createQueryBuilder('t')
            .select("TO_CHAR(t.created_at, 'YYYY-MM')", 'month')
            .addSelect('SUM(CASE WHEN t.type = :income THEN t.amount ELSE 0 END)', 'income')
            .addSelect('SUM(CASE WHEN t.type = :expense THEN t.amount ELSE 0 END)', 'expense')
            .addSelect('COUNT(t.id)', 'transactionCount')
            .where('t.userId = :userId', { userId: req.userId })
            .andWhere('t.created_at >= :sixMonthsAgo', {
                sixMonthsAgo: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
            })
            .groupBy('month')
            .orderBy('month', 'ASC')
            .setParameters({ income: 'income', expense: 'expense' })
            .getRawMany();

        const months = monthsData.map(m => {
            const income = parseFloat(m.income);
            const expense = parseFloat(m.expense);
            return {
                month: m.month,
                income,
                expense,
                balance: income - expense,
                transactionCount: parseInt(m.transactionCount)
            };
        });

        // Calcular comparaciones
        const currentMonth = months[months.length - 1];
        const previousMonth = months[months.length - 2];

        let comparison = null;
        if (currentMonth && previousMonth) {
            comparison = {
                incomeChange: ((currentMonth.income - previousMonth.income) / previousMonth.income * 100) || 0,
                expenseChange: ((currentMonth.expense - previousMonth.expense) / previousMonth.expense * 100) || 0,
                balanceChange: ((currentMonth.balance - previousMonth.balance) / Math.abs(previousMonth.balance) * 100) || 0
            };
        }

        // Generar insights
        const insights = [];
        if (comparison) {
            if (comparison.incomeChange > 0) {
                insights.push(`Tus ingresos aumentaron ${comparison.incomeChange.toFixed(1)}% este mes`);
            } else if (comparison.incomeChange < 0) {
                insights.push(`Tus ingresos disminuyeron ${Math.abs(comparison.incomeChange).toFixed(1)}% este mes`);
            }

            if (comparison.expenseChange > 10) {
                insights.push(`Atención: tus gastos aumentaron ${comparison.expenseChange.toFixed(1)}% este mes`);
            } else if (comparison.expenseChange < -10) {
                insights.push(`¡Excelente! Redujiste tus gastos ${Math.abs(comparison.expenseChange).toFixed(1)}% este mes`);
            }
        }

        res.json({
            months,
            comparison,
            insights,
            summary: {
                totalMonths: months.length,
                averageIncome: months.reduce((sum, m) => sum + m.income, 0) / months.length || 0,
                averageExpense: months.reduce((sum, m) => sum + m.expense, 0) / months.length || 0
            }
        });
    } catch (error) {
        console.error('❌ Error en monthly-comparison:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * @swagger
 * /api/reports/goals-vs-reality:
 *   get:
 *     tags: [Reports]
 *     summary: Comparar metas versus realidad
 *     description: Compara presupuestos y metas de ahorro con resultados reales
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
 *       - in: query
 *         name: end
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Comparación de metas obtenida exitosamente
 */
router.get('/goals-vs-reality', auth, async (req: AuthRequest, res) => {
    try {
        const { start, end } = req.query;
        if (!start || !end) {
            return res.status(400).json({ error: 'Faltan fechas' });
        }

        // Obtener presupuestos activos
        const budgetRepo = AppDataSource.getRepository(Budget);
        const budgets = await budgetRepo
            .createQueryBuilder('b')
            .leftJoinAndSelect('b.category', 'c')
            .where('b.userId = :userId', { userId: req.userId })
            .getMany();

        // Obtener gastos reales por categoría en el período
        const actualExpenses = await txRepo()
            .createQueryBuilder('t')
            .select('c.id', 'categoryId')
            .addSelect('c.name', 'categoryName')
            .addSelect('SUM(t.amount)', 'actualSpent')
            .leftJoin('t.category', 'c')
            .where('t.userId = :userId', { userId: req.userId })
            .andWhere('t.type = :type', { type: 'expense' })
            .andWhere('t.created_at BETWEEN :start AND :end', { start, end })
            .groupBy('c.id, c.name')
            .getRawMany();

        // Obtener metas de ahorro
        const savingsRepo = AppDataSource.getRepository(SavingsGoal);
        const savingsGoals = await savingsRepo
            .createQueryBuilder('s')
            .where('s.userId = :userId', { userId: req.userId })
            .andWhere('s.isDeleted = :deleted', { deleted: false })
            .getMany();

        // Calcular ahorros reales (ingresos - gastos)
        const totalIncome = await txRepo()
            .createQueryBuilder('t')
            .select('SUM(t.amount)', 'total')
            .where('t.userId = :userId', { userId: req.userId })
            .andWhere('t.type = :type', { type: 'income' })
            .andWhere('t.created_at BETWEEN :start AND :end', { start, end })
            .getRawOne();

        const totalExpense = await txRepo()
            .createQueryBuilder('t')
            .select('SUM(t.amount)', 'total')
            .where('t.userId = :userId', { userId: req.userId })
            .andWhere('t.type = :type', { type: 'expense' })
            .andWhere('t.created_at BETWEEN :start AND :end', { start, end })
            .getRawOne();

        const actualSavings = (parseFloat(totalIncome?.total) || 0) - (parseFloat(totalExpense?.total) || 0);

        // Procesar presupuestos vs realidad
        const budgetComparisons = budgets.map(budget => {
            const actual = actualExpenses.find(exp => exp.categoryId === budget.category?.id);
            const actualSpent = parseFloat(actual?.actualSpent) || 0;
            const budgetAmount = parseFloat(budget.limit.toString());

            return {
                category: budget.category?.name || 'Sin categoría',
                budgeted: budgetAmount,
                actual: actualSpent,
                difference: budgetAmount - actualSpent,
                percentage: budgetAmount > 0 ? (actualSpent / budgetAmount * 100) : 0,
                status: actualSpent <= budgetAmount ? 'within_budget' : 'over_budget'
            };
        });

        // Procesar metas de ahorro vs realidad
        const savingsComparisons = savingsGoals.map(goal => {
            const goalAmount = parseFloat(goal.target_amount.toString());
            const currentAmount = parseFloat(goal.current_amount.toString()) || 0;

            return {
                name: goal.name,
                target: goalAmount,
                current: currentAmount,
                progress: goalAmount > 0 ? (currentAmount / goalAmount * 100) : 0,
                remaining: goalAmount - currentAmount,
                status: currentAmount >= goalAmount ? 'completed' : 'in_progress'
            };
        });

        // Generar insights
        const insights = [];
        const overBudgetCategories = budgetComparisons.filter(b => b.status === 'over_budget');
        const withinBudgetCategories = budgetComparisons.filter(b => b.status === 'within_budget');

        if (overBudgetCategories.length > 0) {
            insights.push(`Te pasaste del presupuesto en ${overBudgetCategories.length} categoría(s)`);
        }

        if (withinBudgetCategories.length > 0) {
            insights.push(`Mantuviste el presupuesto en ${withinBudgetCategories.length} categoría(s)`);
        }

        const completedGoals = savingsComparisons.filter(s => s.status === 'completed');
        if (completedGoals.length > 0) {
            insights.push(`¡Felicidades! Completaste ${completedGoals.length} meta(s) de ahorro`);
        }

        res.json({
            budgets: budgetComparisons,
            savings: savingsComparisons,
            actualSavings,
            insights,
            period: { start, end },
            summary: {
                totalBudgets: budgetComparisons.length,
                budgetsWithinLimit: withinBudgetCategories.length,
                totalSavingsGoals: savingsComparisons.length,
                completedSavingsGoals: completedGoals.length
            }
        });
    } catch (error) {
        console.error('❌ Error en goals-vs-reality:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;