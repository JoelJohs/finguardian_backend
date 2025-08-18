import { Transaction } from '../entities/Transaction';
import { format } from 'date-fns';

interface PDFAnalysisData {
    transactions: Transaction[];
    userName: string;
    startDate: string;
    endDate: string;
    totalExpenses: number;
    totalIncomes: number;
    balance: number;
    categoryBreakdown: Record<string, number>;
    transactionCount: number;
}

export class AIAnalysisService {
    /**
     * Extrae los datos clave del PDF y genera contexto para análisis de IA
     */
    static extractDataFromPDF(pdfText: string): any {
        // Extraer información básica del PDF
        const lines = pdfText.split('\n').filter(line => line.trim() !== '');

        const analysisData: any = {
            reportDate: this.extractReportDate(lines),
            userName: this.extractUserName(lines),
            period: this.extractPeriod(lines),
            financialSummary: this.extractFinancialSummary(lines),
            categoryBreakdown: this.extractCategoryBreakdown(lines),
            transactionDetails: this.extractTransactionDetails(lines),
            statisticalData: this.extractStatisticalData(lines)
        };

        return analysisData;
    }

    /**
     * Genera análisis inteligente basado en los datos del PDF
     */
    static generateIntelligentAnalysis(pdfData: any): string {
        const { financialSummary, categoryBreakdown, period, userName } = pdfData;

        let analysis = `Análisis Financiero Inteligente para ${userName}\n`;
        analysis += `=================================\n\n`;
        analysis += `Período analizado: ${period}\n\n`;

        // Análisis de balance
        if (financialSummary) {
            analysis += `📊 ANÁLISIS DE BALANCE:\n`;
            const balance = financialSummary.balance || 0;

            if (balance >= 0) {
                analysis += `✅ Excelente gestión financiera! Mantienes un balance positivo de $${balance.toFixed(2)}.\n`;
                analysis += `Esto demuestra disciplina en tus hábitos de gasto y una buena planificación financiera.\n\n`;

                if (balance > 1000) {
                    analysis += `💡 Tu superávit es significativo. Considera estas opciones:\n`;
                    analysis += `   • Crear un fondo de emergencia (3-6 meses de gastos)\n`;
                    analysis += `   • Invertir en instrumentos de ahorro a largo plazo\n`;
                    analysis += `   • Acelerar el pago de deudas si las tienes\n\n`;
                }
            } else {
                analysis += `⚠️ Tu balance es negativo por $${Math.abs(balance).toFixed(2)}.\n`;
                analysis += `Es importante implementar estrategias de ahorro y reducción de gastos.\n\n`;

                analysis += `🎯 Recomendaciones inmediatas:\n`;
                analysis += `   • Revisa tus gastos no esenciales\n`;
                analysis += `   • Implementa un presupuesto estricto\n`;
                analysis += `   • Busca fuentes adicionales de ingresos\n\n`;
            }
        }

        // Análisis de patrones de gasto
        if (categoryBreakdown && Object.keys(categoryBreakdown).length > 0) {
            analysis += `💸 ANÁLISIS DE PATRONES DE GASTO:\n`;

            const sortedCategories = Object.entries(categoryBreakdown)
                .sort(([, a], [, b]) => (b as number) - (a as number));

            const totalExpenses = sortedCategories.reduce((sum, [, amount]) => sum + (amount as number), 0);
            const topCategory = sortedCategories[0];

            if (topCategory) {
                const [categoryName, amount] = topCategory;
                const percentage = ((amount as number) / totalExpenses * 100);

                analysis += `Tu categoría de mayor gasto es "${categoryName}" con $${(amount as number).toFixed(2)} (${percentage.toFixed(1)}% del total).\n\n`;

                // Análisis específico por categoría
                analysis += this.generateCategorySpecificAdvice(categoryName, amount as number, percentage);
            }

            // Diversificación de gastos
            if (sortedCategories.length > 1) {
                analysis += `📈 DIVERSIFICACIÓN DE GASTOS:\n`;
                if (sortedCategories.length >= 5) {
                    analysis += `✅ Tienes una buena diversificación en tus gastos (${sortedCategories.length} categorías).\n`;
                    analysis += `Esto indica un estilo de vida equilibrado.\n\n`;
                } else {
                    analysis += `⚠️ Tus gastos se concentran en pocas categorías (${sortedCategories.length}).\n`;
                    analysis += `Considera si esta concentración es intencional o si podrías beneficiarte de más variedad.\n\n`;
                }
            }
        }

        // Tendencias y proyecciones
        analysis += `🔮 PROYECCIONES Y TENDENCIAS:\n`;
        if (financialSummary) {
            const monthlyProjection = this.calculateMonthlyProjection(financialSummary);
            analysis += monthlyProjection;
        }

        // Consejos personalizados
        analysis += `\n💡 ESTRATEGIAS PERSONALIZADAS:\n`;
        analysis += this.generatePersonalizedStrategies(pdfData);

        // Plan de acción
        analysis += `\n🚀 PLAN DE ACCIÓN RECOMENDADO:\n`;
        analysis += this.generateActionPlan(pdfData);

        return analysis;
    }

    private static extractReportDate(lines: string[]): string {
        const datePattern = /Generado el (\d{2}\/\d{2}\/\d{4})/;
        for (const line of lines) {
            const match = line.match(datePattern);
            if (match) return match[1];
        }
        return format(new Date(), 'dd/MM/yyyy');
    }

    private static extractUserName(lines: string[]): string {
        const userPattern = /¡Hola (.+?)!/;
        for (const line of lines) {
            const match = line.match(userPattern);
            if (match) return match[1];
        }
        return 'Usuario';
    }

    private static extractPeriod(lines: string[]): string {
        const periodPattern = /del período del (.+?) al (.+?)\./;
        for (const line of lines) {
            const match = line.match(periodPattern);
            if (match) return `${match[1]} al ${match[2]}`;
        }
        return 'Período no especificado';
    }

    private static extractFinancialSummary(lines: string[]): any {
        const summary: any = {};

        // Buscar totales
        for (const line of lines) {
            if (line.includes('Total de Ingresos:')) {
                const match = line.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
                if (match) summary.totalIncomes = parseFloat(match[1].replace(',', ''));
            }
            if (line.includes('Total de Gastos:')) {
                const match = line.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
                if (match) summary.totalExpenses = parseFloat(match[1].replace(',', ''));
            }
            if (line.includes('Balance Final:')) {
                const match = line.match(/\$(-?\d+(?:,\d{3})*(?:\.\d{2})?)/);
                if (match) summary.balance = parseFloat(match[1].replace(',', ''));
            }
        }

        return summary;
    }

    private static extractCategoryBreakdown(lines: string[]): Record<string, number> {
        const breakdown: Record<string, number> = {};
        let inExpenseSection = false;

        for (const line of lines) {
            if (line.includes('GASTOS POR CATEGORÍA:')) {
                inExpenseSection = true;
                continue;
            }

            if (line.includes('INGRESOS POR CATEGORÍA:')) {
                inExpenseSection = false;
                continue;
            }

            if (inExpenseSection && line.match(/^\d+\./)) {
                const match = line.match(/\d+\.\s+(.+?):\s+\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
                if (match) {
                    const category = match[1];
                    const amount = parseFloat(match[2].replace(',', ''));
                    breakdown[category] = amount;
                }
            }
        }

        return breakdown;
    }

    private static extractTransactionDetails(lines: string[]): any[] {
        const transactions: any[] = [];
        let inTableSection = false;

        for (const line of lines) {
            if (line.includes('Detalle de Transacciones')) {
                inTableSection = true;
                continue;
            }

            if (inTableSection && line.includes('Desglose por Categorías')) {
                break;
            }

            // Aquí podrías implementar la extracción de transacciones individuales
            // Por simplicidad, omitimos esta parte ya que el análisis principal se basa en los resúmenes
        }

        return transactions;
    }

    private static extractStatisticalData(lines: string[]): any {
        const stats: any = {};

        for (const line of lines) {
            if (line.includes('Total de transacciones:')) {
                const match = line.match(/Total de transacciones:\s+(\d+)/);
                if (match) stats.totalTransactions = parseInt(match[1]);
            }
            if (line.includes('Promedio diario de gastos:')) {
                const match = line.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
                if (match) stats.avgDailyExpenses = parseFloat(match[1].replace(',', ''));
            }
            if (line.includes('Promedio diario de ingresos:')) {
                const match = line.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
                if (match) stats.avgDailyIncomes = parseFloat(match[1].replace(',', ''));
            }
        }

        return stats;
    }

    private static generateCategorySpecificAdvice(category: string, amount: number, percentage: number): string {
        let advice = '';
        const categoryLower = category.toLowerCase();

        if (percentage > 40) {
            advice += `⚠️ Esta categoría representa una porción muy significativa de tus gastos.\n`;
        }

        // Consejos específicos por tipo de categoría
        if (categoryLower.includes('comida') || categoryLower.includes('alimentación') || categoryLower.includes('restaurant')) {
            advice += `🍽️ Consejos para optimizar gastos en alimentación:\n`;
            advice += `   • Planifica menús semanales\n`;
            advice += `   • Aumenta las comidas caseras vs. restaurantes\n`;
            advice += `   • Compra con lista para evitar gastos impulsivos\n`;
            advice += `   • Aprovecha ofertas y descuentos\n\n`;
        } else if (categoryLower.includes('transporte') || categoryLower.includes('combustible') || categoryLower.includes('uber')) {
            advice += `🚗 Optimización de gastos en transporte:\n`;
            advice += `   • Evalúa opciones de transporte público\n`;
            advice += `   • Considera compartir viajes\n`;
            advice += `   • Planifica rutas eficientes\n`;
            advice += `   • Mantén tu vehículo en buen estado para eficiencia\n\n`;
        } else if (categoryLower.includes('entretenimiento') || categoryLower.includes('ocio') || categoryLower.includes('diversión')) {
            advice += `🎯 Equilibrando entretenimiento y presupuesto:\n`;
            advice += `   • Busca actividades gratuitas o de bajo costo\n`;
            advice += `   • Establece un presupuesto mensual para ocio\n`;
            advice += `   • Aprovecha promociones y días de descuento\n`;
            advice += `   • Alterna actividades costosas con opciones económicas\n\n`;
        } else if (categoryLower.includes('compras') || categoryLower.includes('ropa') || categoryLower.includes('shopping')) {
            advice += `🛍️ Estrategias para compras inteligentes:\n`;
            advice += `   • Implementa la regla de las 24 horas antes de comprar\n`;
            advice += `   • Diferencia entre necesidades y deseos\n`;
            advice += `   • Busca alternativas de segunda mano\n`;
            advice += `   • Aprovecha temporadas de rebajas\n\n`;
        } else {
            advice += `💡 Recomendaciones generales para esta categoría:\n`;
            advice += `   • Revisa si todos los gastos son realmente necesarios\n`;
            advice += `   • Busca alternativas más económicas\n`;
            advice += `   • Establece un límite mensual para esta categoría\n`;
            advice += `   • Compara precios antes de tomar decisiones\n\n`;
        }

        return advice;
    }

    private static calculateMonthlyProjection(financialSummary: any): string {
        let projection = '';

        if (financialSummary.balance !== undefined) {
            const monthlyBalance = financialSummary.balance;
            const annualProjection = monthlyBalance * 12;

            projection += `Si mantienes este patrón de gastos e ingresos:\n`;
            projection += `   • Proyección anual: ${annualProjection >= 0 ? '+' : ''}$${annualProjection.toFixed(2)}\n`;

            if (annualProjection > 5000) {
                projection += `   • ¡Excelente! Podrías ahorrar significativamente\n`;
            } else if (annualProjection > 0) {
                projection += `   • Balance positivo, pero hay espacio para mejorar\n`;
            } else {
                projection += `   • ⚠️ Riesgo financiero - necesitas ajustes urgentes\n`;
            }
        }

        return projection;
    }

    private static generatePersonalizedStrategies(pdfData: any): string {
        let strategies = '';
        const { financialSummary, categoryBreakdown } = pdfData;

        // Estrategia basada en el balance
        if (financialSummary?.balance > 0) {
            strategies += `🎯 Estrategias de crecimiento financiero:\n`;
            strategies += `   • Automatiza el ahorro del 20% de tus ingresos\n`;
            strategies += `   • Considera inversiones de bajo riesgo\n`;
            strategies += `   • Aumenta gradualmente tu fondo de emergencia\n\n`;
        } else {
            strategies += `🎯 Estrategias de recuperación financiera:\n`;
            strategies += `   • Identifica gastos no esenciales para reducir\n`;
            strategies += `   • Implementa un presupuesto 50/30/20 modificado\n`;
            strategies += `   • Busca formas de aumentar tus ingresos\n\n`;
        }

        // Estrategias específicas por patrones de gasto
        if (categoryBreakdown && Object.keys(categoryBreakdown).length > 0) {
            const topCategories = Object.entries(categoryBreakdown)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 2);

            strategies += `📊 Optimización de tus principales categorías de gasto:\n`;
            topCategories.forEach(([category, amount], index) => {
                strategies += `   ${index + 1}. ${category}: Busca reducir un 10-15% mensual\n`;
            });
        }

        return strategies;
    }

    private static generateActionPlan(pdfData: any): string {
        let actionPlan = '';

        actionPlan += `Semana 1-2: Análisis y preparación\n`;
        actionPlan += `   • Revisa detalladamente todos tus gastos\n`;
        actionPlan += `   • Identifica gastos innecesarios\n`;
        actionPlan += `   • Establece metas financieras específicas\n\n`;

        actionPlan += `Semana 3-4: Implementación\n`;
        actionPlan += `   • Aplica las estrategias de reducción identificadas\n`;
        actionPlan += `   • Configura presupuestos por categoría\n`;
        actionPlan += `   • Comienza a rastrear gastos diarios\n\n`;

        actionPlan += `Mes 2: Consolidación\n`;
        actionPlan += `   • Evalúa el progreso vs. metas establecidas\n`;
        actionPlan += `   • Ajusta estrategias según resultados\n`;
        actionPlan += `   • Automatiza procesos de ahorro\n\n`;

        actionPlan += `Mes 3+: Crecimiento\n`;
        actionPlan += `   • Busca oportunidades de inversión\n`;
        actionPlan += `   • Incrementa gradualmente tus metas de ahorro\n`;
        actionPlan += `   • Revisa y optimiza tu estrategia financiera`;

        return actionPlan;
    }
}
