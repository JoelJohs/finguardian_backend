// backend/src/seed.ts
import { AppDataSource } from "./config/database";
import { Category } from "./entities/Category";

const categories = [
  // Income
  { name: "Sueldo", type: "income" as const, icon: "💰", color: "#10b981" },
  { name: "Freelance", type: "income" as const, icon: "💻", color: "#8b5cf6" },
  {
    name: "Inversiones",
    type: "income" as const,
    icon: "📈",
    color: "#f59e0b",
  },

  // Expenses
  { name: "Comida", type: "expense" as const, icon: "🍔", color: "#ef4444" },
  {
    name: "Transporte",
    type: "expense" as const,
    icon: "🚌",
    color: "#3b82f6",
  },
  {
    name: "Entretenimiento",
    type: "expense" as const,
    icon: "🎮",
    color: "#a855f7",
  },
  { name: "Salud", type: "expense" as const, icon: "💊", color: "#ec4899" },
  { name: "Educación", type: "expense" as const, icon: "📚", color: "#06b6d4" },
  { name: "Hogar", type: "expense" as const, icon: "🏠", color: "#84cc16" },
  { name: "Regalos", type: "expense" as const, icon: "🎁", color: "#f97316" },
  { name: "Otros", type: "expense" as const, icon: "📦", color: "#64748b" },
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
