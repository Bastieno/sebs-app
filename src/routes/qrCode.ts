import { Router } from 'express';
import { generateQRCode, validateQRCode } from '../controllers/qrCodeController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: QRCode
 *   description: QR Code generation and validation
 */

/**
 * @swagger
 * /api/qr-code/generate:
 *   post:
 *     summary: Generate a QR code for the current user
 *     tags: [QRCode]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: QR code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 qrCode:
 *                   type: string
 *                   description: The generated QR code data URL
 *       '401':
 *         description: Unauthorized
 */
router.post('/generate', authenticate, generateQRCode);

/**
 * @swagger
 * /api/qr-code/validate:
 *   post:
 *     summary: Validate a QR code
 *     tags: [QRCode]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qrCode
 *             properties:
 *               qrCode:
 *                 type: string
 *     responses:
 *       '200':
 *         description: QR code is valid
 *       '400':
 *         description: Invalid QR code
 *       '401':
 *         description: Unauthorized
 */
router.post('/validate', authenticate, validateQRCode);

export default router;
