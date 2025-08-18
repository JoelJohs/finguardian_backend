import PDFDocument from 'pdfkit';
import { Transaction } from '../entities/Transaction';
import { format, parseISO } from 'date-fns';

export function buildTransactionPDF(
    transactions: Transaction[],
    userName: string,
    start: string,
    end: string
): PDFKit.PDFDocument {
    const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
    });

    // Configurar colores
    const primaryColor = '#2563eb';
    const textColor = '#1f2937';
    const borderColor = '#e5e7eb';

    // Header principal
    doc.rect(0, 0, doc.page.width, 80).fill(primaryColor);

    doc.fillColor('white')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('FinGuardian', 50, 25);

    doc.fontSize(12)
        .font('Helvetica')
        .text('Reporte Financiero Detallado', 50, 50);

    // Información del período y usuario
    let currentY = 100;
    const formattedStart = format(parseISO(start), 'dd/MM/yyyy');
    const formattedEnd = format(parseISO(end), 'dd/MM/yyyy');

    doc.fillColor(textColor)
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(`¡Hola ${userName}!`, 50, currentY);

    currentY += 25;
    doc.fontSize(12)
        .font('Helvetica')
        .text(`Período: ${formattedStart} al ${formattedEnd}`, 50, currentY);

    currentY += 15;
    doc.text(`Generado el ${format(new Date(), 'dd/MM/yyyy')}`, 50, currentY);

    // Resumen financiero
    currentY += 40;
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const balance = totalIncome - totalExpense;

    doc.fontSize(14)
        .font('Helvetica-Bold')
        .text('RESUMEN FINANCIERO', 50, currentY);

    currentY += 25;

    // Cajas de resumen
    const boxWidth = (doc.page.width - 100) / 3;
    const boxHeight = 50;

    // Total de ingresos
    doc.rect(50, currentY, boxWidth - 10, boxHeight).fill('#ecfdf5').stroke(borderColor);
    doc.fillColor('#065f46')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Total de Ingresos', 55, currentY + 10);
    doc.fontSize(14)
        .text(`$${totalIncome.toFixed(2)}`, 55, currentY + 25);

    // Total de gastos
    doc.rect(50 + boxWidth, currentY, boxWidth - 10, boxHeight).fill('#fef2f2').stroke(borderColor);
    doc.fillColor('#991b1b')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Total de Gastos', 55 + boxWidth, currentY + 10);
    doc.fontSize(14)
        .text(`$${totalExpense.toFixed(2)}`, 55 + boxWidth, currentY + 25);

    // Balance
    const balanceColor = balance >= 0 ? '#065f46' : '#991b1b';
    doc.rect(50 + boxWidth * 2, currentY, boxWidth - 10, boxHeight).fill(balance >= 0 ? '#ecfdf5' : '#fef2f2').stroke(borderColor);
    doc.fillColor(balanceColor)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Balance Final', 55 + boxWidth * 2, currentY + 10);
    doc.fontSize(14)
        .text(`$${balance.toFixed(2)}`, 55 + boxWidth * 2, currentY + 25);

    currentY += boxHeight + 30;

    // Desglose por categorías
    if (transactions.length > 0) {
        doc.fillColor(textColor)
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('DESGLOSE POR CATEGORIAS', 50, currentY);

        currentY += 20;

        // Gastos por categoría
        const expenses = transactions.filter(t => t.type === 'expense');
        const categorySpending = expenses.reduce((acc, t) => {
            const category = t.category.name;
            acc[category] = (acc[category] || 0) + Number(t.amount);
            return acc;
        }, {} as Record<string, number>);

        if (Object.keys(categorySpending).length > 0) {
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .text('GASTOS POR CATEGORIA:', 50, currentY);
            currentY += 15;

            const sortedExpenses = Object.entries(categorySpending)
                .sort(([, a], [, b]) => b - a);

            sortedExpenses.forEach(([category, amount], index) => {
                const percentage = (amount / totalExpense * 100);
                doc.fontSize(10)
                    .font('Helvetica')
                    .text(`${index + 1}. ${category}: $${amount.toFixed(2)} (${percentage.toFixed(1)}%)`, 60, currentY);
                currentY += 12;
            });
        }

        currentY += 15;

        // Ingresos por categoría
        const incomes = transactions.filter(t => t.type === 'income');
        const categoryIncomes = incomes.reduce((acc, t) => {
            const category = t.category.name;
            acc[category] = (acc[category] || 0) + Number(t.amount);
            return acc;
        }, {} as Record<string, number>);

        if (Object.keys(categoryIncomes).length > 0) {
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .text('INGRESOS POR CATEGORIA:', 50, currentY);
            currentY += 15;

            const sortedIncomes = Object.entries(categoryIncomes)
                .sort(([, a], [, b]) => b - a);

            sortedIncomes.forEach(([category, amount], index) => {
                const percentage = (amount / totalIncome * 100);
                doc.fontSize(10)
                    .font('Helvetica')
                    .text(`${index + 1}. ${category}: $${amount.toFixed(2)} (${percentage.toFixed(1)}%)`, 60, currentY);
                currentY += 12;
            });
        }
    }

    // Tabla de transacciones (si caben en la página actual)
    if (transactions.length > 0 && currentY < doc.page.height - 200) {
        currentY += 30;

        doc.fontSize(14)
            .font('Helvetica-Bold')
            .text('DETALLE DE TRANSACCIONES', 50, currentY);

        currentY += 20;

        // Headers de la tabla
        const colWidths = [80, 120, 60, 80, 140];
        const headers = ['Fecha', 'Categoría', 'Tipo', 'Monto', 'Descripción'];

        // Fondo del header
        doc.rect(50, currentY, colWidths.reduce((a, b) => a + b, 0), 20).fill('#f8fafc').stroke(borderColor);

        let currentX = 50;
        doc.fontSize(10)
            .font('Helvetica-Bold')
            .fillColor(textColor);

        headers.forEach((header, i) => {
            doc.text(header, currentX + 5, currentY + 6, { width: colWidths[i] - 10 });
            currentX += colWidths[i];
        });

        currentY += 25;

        // Filas de datos (máximo 15 para que quepa en la página)
        const maxRows = Math.min(transactions.length, 15);

        for (let i = 0; i < maxRows; i++) {
            const transaction = transactions[i];

            // Alternar colores de fila
            if (i % 2 === 0) {
                doc.rect(50, currentY, colWidths.reduce((a, b) => a + b, 0), 18).fill('#fafafa');
            }

            currentX = 50;
            doc.fontSize(9).font('Helvetica').fillColor(textColor);

            // Fecha
            doc.text(format(transaction.created_at, 'dd/MM/yyyy'), currentX + 5, currentY + 4, { width: colWidths[0] - 10 });
            currentX += colWidths[0];

            // Categoría
            doc.text(transaction.category.name, currentX + 5, currentY + 4, { width: colWidths[1] - 10 });
            currentX += colWidths[1];

            // Tipo
            const typeColor = transaction.type === 'income' ? '#065f46' : '#991b1b';
            doc.fillColor(typeColor)
                .text(transaction.type === 'income' ? 'Ingreso' : 'Gasto', currentX + 5, currentY + 4, { width: colWidths[2] - 10 });
            currentX += colWidths[2];

            // Monto
            doc.fillColor(typeColor)
                .text(`$${Number(transaction.amount).toFixed(2)}`, currentX + 5, currentY + 4, { width: colWidths[3] - 10 });
            currentX += colWidths[3];

            // Descripción
            doc.fillColor(textColor)
                .text(transaction.description || '-', currentX + 5, currentY + 4, { width: colWidths[4] - 10 });

            currentY += 18;
        }

        // Nota si hay más transacciones
        if (transactions.length > maxRows) {
            currentY += 10;
            doc.fontSize(9)
                .fillColor('#6b7280')
                .text(`... y ${transactions.length - maxRows} transacciones más`, 50, currentY);
        }
    }

    // Footer
    const footerY = doc.page.height - 40;
    doc.fontSize(8)
        .fillColor('#6b7280')
        .text('Generado por FinGuardian - Tu asistente financiero personal', 50, footerY, {
            width: doc.page.width - 100,
            align: 'center'
        });

    return doc;
}
