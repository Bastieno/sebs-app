import { Router } from 'express';
import { logAccess } from '../controllers/accessController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/log', authenticate, logAccess);

export default router;
