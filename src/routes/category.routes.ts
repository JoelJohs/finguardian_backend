import { Router } from "express";
import { AppDataSource } from "../config/database";
import { Category } from "../entities/Category";
import { Transaction } from "../entities/Transaction";
import { auth, AuthRequest } from "../middlewares/auth";

const router = Router();

// GET /api/categories - Obtener todas las categorías
router.get("/", async (req, res) => {
    try {
        const categoryRepo = AppDataSource.getRepository(Category);
        const categories = await categoryRepo.find({
            order: { name: "ASC" }
        });

        res.json(categories);
    } catch (error) {
        console.error("Error al obtener categorías:", error);
        res.status(500).json({
            message: "Error interno del servidor al obtener categorías"
        });
    }
});

// GET /api/categories/:type - Obtener categorías por tipo (income/expense)
router.get("/:type", async (req, res) => {
    try {
        const { type } = req.params;

        if (type !== "income" && type !== "expense") {
            return res.status(400).json({
                message: "Tipo de categoría inválido. Debe ser 'income' o 'expense'"
            });
        }

        const categoryRepo = AppDataSource.getRepository(Category);
        const categories = await categoryRepo.find({
            where: { type },
            order: { name: "ASC" }
        });

        res.json(categories);
    } catch (error) {
        console.error("Error al obtener categorías por tipo:", error);
        res.status(500).json({
            message: "Error interno del servidor al obtener categorías"
        });
    }
});

// GET /api/categories/stats/:userId - Obtener estadísticas de gastos por categoría para un usuario
router.get("/stats/:userId", auth, async (req: AuthRequest, res) => {
    try {
        const { userId } = req.params;

        const transactionRepo = AppDataSource.getRepository(Transaction);

        // Obtener estadísticas de gastos por categoría del mes actual
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

        const categoryStats = await transactionRepo
            .createQueryBuilder("transaction")
            .leftJoinAndSelect("transaction.category", "category")
            .select([
                "category.id as categoryId",
                "category.name as categoryName",
                "category.icon as categoryIcon",
                "category.color as categoryColor",
                "category.type as categoryType",
                "SUM(transaction.amount) as totalAmount",
                "COUNT(transaction.id) as transactionCount"
            ])
            .where("transaction.user.id = :userId", { userId })
            .andWhere("transaction.created_at >= :startOfMonth", { startOfMonth })
            .andWhere("transaction.created_at <= :endOfMonth", { endOfMonth })
            .groupBy("category.id, category.name, category.icon, category.color, category.type")
            .orderBy("totalAmount", "DESC")
            .getRawMany();

        res.json(categoryStats);
    } catch (error) {
        console.error("Error al obtener estadísticas de categorías:", error);
        res.status(500).json({
            message: "Error interno del servidor al obtener estadísticas"
        });
    }
});

export default router;
