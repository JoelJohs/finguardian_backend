import { Router } from 'express';
import { auth, AuthRequest } from '../middlewares/auth';
import { getLifetime } from '../services/lifetime.service';

const router = Router();

router.get('/', auth, async (req: AuthRequest, res) => {
    const data = await getLifetime(req.userId!);
    res.json(data);
});

export default router;