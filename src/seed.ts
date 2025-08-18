// backend/src/seed.ts
import { AppDataSource } from "./config/database";
import { Category } from "./entities/Category";

const categories = [
  // Income
  { name: "Sueldo", type: "income" as const, icon: "💰", color: "#10b981" },
  { name: "Freelance", type: "income" as const, icon: "🧑‍💻", color: "#8b5cf6" },
  { name: "Inversiones", type: "income" as const, icon: "📈", color: "#f59e0b" },
  { name: "Regalos recibidos", type: "income" as const, icon: "🎁", color: "#fbbf24" },
  { name: "Bonos", type: "income" as const, icon: "🎉", color: "#a78bfa" },
  { name: "Reembolsos", type: "income" as const, icon: "🔄", color: "#22d3ee" },
  { name: "Apoyos/Becas", type: "income" as const, icon: "🏫", color: "#60a5fa" },
  { name: "Ingresos pasivos", type: "income" as const, icon: "💤", color: "#818cf8" },

  // Expenses
  { name: "Comida", type: "expense" as const, icon: "🍔", color: "#ef4444" },
  { name: "Transporte", type: "expense" as const, icon: "🚗", color: "#3b82f6" },
  { name: "Entretenimiento", type: "expense" as const, icon: "🎮", color: "#a855f7" },
  { name: "Salud", type: "expense" as const, icon: "💊", color: "#ec4899" },
  { name: "Educación", type: "expense" as const, icon: "📚", color: "#06b6d4" },
  { name: "Hogar", type: "expense" as const, icon: "🏠", color: "#84cc16" },
  { name: "Regalos", type: "expense" as const, icon: "🎁", color: "#f97316" },
  { name: "Otros", type: "expense" as const, icon: "📦", color: "#64748b" },
  { name: "Bebidas energéticas", type: "expense" as const, icon: "🥤", color: "#f97316" },
  { name: "Snacks", type: "expense" as const, icon: "🍪", color: "#eab308" },
  { name: "Salidas sociales", type: "expense" as const, icon: "🍻", color: "#0b2777" },
  { name: "Suscripciones digitales", type: "expense" as const, icon: "💻", color: "#0ea5e9" },
  { name: "Café", type: "expense" as const, icon: "☕", color: "#6b7280" },
  {
    name: "Ahorros usados para su propósito",
    type: "expense" as const,
    icon: "🎯",
    color: "#14b8a6",
  },
];

async function seed() {
  await AppDataSource.initialize();

  const categoryRepo = AppDataSource.getRepository(Category);

  // Verificar si ya hay categorías
  const count = await categoryRepo.count();
  if (count === 0) {
    await categoryRepo.save(categories);
    console.log("🌱 Categorías creadas exitosamente");
  }

  await AppDataSource.destroy();
}

seed().catch(console.error);
