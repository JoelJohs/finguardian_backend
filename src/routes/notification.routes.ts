import { Router } from 'express';
import { auth, AuthRequest } from '../middlewares/auth';
import { getNotifications, clear } from '../services/notification.service';

const router = Router();

// GET /api/notifications
router.get('/', auth, (req: AuthRequest, res) => {
    const list = getNotifications(req.userId!);
    res.json(list);
});

// DELETE /api/notifications  (marcar como leídas)
router.delete('/', auth, (req: AuthRequest, res) => {
    clear(req.userId!);
    res.status(204).send();
});

export default router;