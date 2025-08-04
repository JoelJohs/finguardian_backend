import { Router } from "express";

// Rutas
import userRoutes from "./user.routes";
import transactionRoutes from "./transaction.route";
import dashboardRoutes from "./dashboard.routes";
import savingRoutes from "./saving.routes";
import lifetimeRoutes from "./lifetime.routes";
import budgetRoutes from "./budget.routes";
import notificationRoutes from "./notification.routes";

const router = Router();

// health check
router.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Rutas de la API
router.use("/users", userRoutes);
router.use("/transactions", transactionRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/savings-goals", savingRoutes);
router.use("/lifetime-savings", lifetimeRoutes);
router.use("/budgets", budgetRoutes)
router.use("/notifications", notificationRoutes);

// Exportar el router
export default router;
