import { Router } from 'express';
import { validateQrCode, getAccessLogs, getCurrentCapacity } from '../controllers/accessController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// This endpoint is likely to be hit by the QR scanner, which may not be authenticated
router.post('/validate-qr', validateQrCode);

// This endpoint is for admins to view logs
router.get('/logs', requireAdmin, getAccessLogs);

// This endpoint is for admins to view current capacity
router.get('/current-capacity', requireAdmin, getCurrentCapacity);

export default router;
