import { Router } from 'express';
import { validateQrCode, getAccessLogs, getCurrentCapacity } from '../controllers/accessController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Access
 *   description: Access control related endpoints
 */

/**
 * @swagger
 * /api/access/validate-qr:
 *   post:
 *     summary: Validate a QR code for access
 *     tags: [Access]
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
 *                 example: "some-qr-code-string"
 *     responses:
 *       '200':
 *         description: QR code is valid
 *       '400':
 *         description: Invalid QR code
 *       '403':
 *         description: Access denied
 */
router.post('/validate-qr', validateQrCode);

/**
 * @swagger
 * /api/access/logs:
 *   get:
 *     summary: Get access logs
 *     tags: [Access]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of access logs
 *       '401':
 *         description: Unauthorized
 */
router.get('/logs', getAccessLogs);

/**
 * @swagger
 * /api/access/current-capacity:
 *   get:
 *     summary: Get current capacity
 *     tags: [Access]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Current capacity information
 *       '401':
 *         description: Unauthorized
 */
router.get('/current-capacity', getCurrentCapacity);

export default router;
