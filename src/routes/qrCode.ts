import { Router } from 'express';
import { generateQRCode, validateQRCode } from '../controllers/qrCodeController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/generate', authenticate, generateQRCode);
router.post('/validate', authenticate, validateQRCode);

export default router;
