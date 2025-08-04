import { Router } from "express";
import { auth, AuthRequest } from "../middlewares/auth";
import { getSummary } from "../services/dashboard.service";

const router = Router();

// GET /dashboard/summary?period=month|week|today

router.get("/summary", auth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const period = (req.query.period as string) || "month";

  let from = new Date();

  switch (period) {
    case "today":
      from.setHours(0, 0, 0, 0);
      break;
    case "week":
      from.setDate(from.getDate() - 7);
      break;
    case "month":
    default:
      from = new Date(from.getFullYear(), from.getMonth(), 1);
      break;
  }
  const to = new Date();

  const summary = await getSummary(userId, from, to);
  res.json({ period, summary });
});

export default router;
