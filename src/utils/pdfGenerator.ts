import PDFDocument from 'pdfkit';
import { Transaction } from '../entities/Transaction';
import { format } from 'date-fns';

export function buildTransactionPDF(
    transactions: Transaction[],
    userName: string,
    start: string,
    end: string
): PDFKit.PDFDocument {
    const doc = new PDFDocument({ margin: 50 });

    // Header
    doc.fontSize(20).text('FinGuardian – Resumen de Gastos', 50, 50);
    doc.fontSize(12).text(`Usuario: ${userName}`, 50, 90);
    doc.text(`Período: ${start} al ${end}`, 50, 110);
    doc.moveDown();

    // Tabla
    const tableTop = 150;
    const positions = [50, 120, 220, 320, 420];
    const headers = ['Fecha', 'Categoría', 'Tipo', 'Monto', 'Descripción'];
    doc.fontSize(10);
    headers.forEach((h, i) => doc.text(h, positions[i], tableTop));

    let y = tableTop + 20;
    let totalExpense = 0;
    let totalIncome = 0;

    transactions.forEach((t) => {
        const amount = Number(t.amount); // Convertir a número
        doc.text(format(t.created_at, 'yyyy-MM-dd'), positions[0], y);
        doc.text(t.category.name, positions[1], y);
        doc.text(t.type, positions[2], y);
        doc.text(`$${amount.toFixed(2)}`, positions[3], y);
        doc.text(t.description || '-', positions[4], y);
        y += 15;

        if (t.type === 'expense') totalExpense += amount;
        else totalIncome += amount;
    });

    // Totales
    y += 20;
    doc.text(`Total Ingresos: $${totalIncome.toFixed(2)}`, 50, y);
    doc.text(`Total Gastos:   $${totalExpense.toFixed(2)}`, 50, y + 15);
    doc.text(`Balance:        $${(totalIncome - totalExpense).toFixed(2)}`, 50, y + 30);

    doc.end();
    return doc;
}