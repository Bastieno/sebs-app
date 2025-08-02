import { Router } from 'express';
import { validateQrCode, getAccessLogs } from '../controllers/accessController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// This endpoint is likely to be hit by the QR scanner, which may not be authenticated
router.post('/validate-qr', validateQrCode);

// This endpoint is for admins to view logs
router.get('/logs', requireAdmin, getAccessLogs);

export default router;
