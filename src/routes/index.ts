import { Router } from "express";

// Rutas
import userRoutes from "./user.routes";
import transactionRoutes from "./transaction.route";
import dashboardRoutes from "./dashboard.routes";
import savingRoutes from "./saving.routes";
import lifetimeRoutes from "./lifetime.routes";
import budgetRoutes from "./budget.routes";
import notificationRoutes from "./notification.routes";
import exportRoutes from "./export.routes"
import exportPDFRoutes from "./pdf.routes"
import reportRoutes from './report.routes'

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
router.use("/export", exportRoutes);
router.use("/export", exportPDFRoutes);
router.use("/reports", reportRoutes);

// Exportar el router
export default router;
