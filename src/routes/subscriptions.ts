import { Router } from 'express';
import { 
  applyForSubscription, 
  uploadPaymentReceipt, 
  getUserSubscriptions, 
  getSubscriptionQRCode, 
  getSubscriptionStatus,
  renewSubscription
} from '../controllers/subscriptionController';
import { requireAuth } from '../middleware/auth';
import { uploadReceipt, handleUploadError } from '../middleware/upload';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Subscription management endpoints
 */

/**
 * @swagger
 * /api/subscriptions/apply:
 *   post:
 *     summary: Apply for a new subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               planId:
 *                 type: string
 *               timeSlot:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       '201':
 *         description: Subscription application created
 *       '401':
 *         description: Unauthorized
 */
router.post('/apply', requireAuth, applyForSubscription);

/**
 * @swagger
 * /api/subscriptions/{subscriptionId}/upload-receipt:
 *   post:
 *     summary: Upload payment receipt for subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               receipt:
 *                 type: string
 *                 format: binary
 *               amount:
 *                 type: number
 *     responses:
 *       '200':
 *         description: Receipt uploaded successfully
 *       '401':
 *         description: Unauthorized
 */
router.post(
  '/:subscriptionId/upload-receipt', 
  requireAuth, 
  uploadReceipt, 
  handleUploadError, 
  uploadPaymentReceipt
);

/**
 * @swagger
 * /api/subscriptions:
 *   get:
 *     summary: Get user's subscriptions
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of user's subscriptions
 *       '401':
 *         description: Unauthorized
 */
router.get('/', requireAuth, getUserSubscriptions);

/**
 * @swagger
 * /api/subscriptions/{subscriptionId}/qr-code:
 *   get:
 *     summary: Get QR code for active subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: QR code for the subscription
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Subscription not found
 */
router.get('/:subscriptionId/qr-code', requireAuth, getSubscriptionQRCode);

/**
 * @swagger
 * /api/subscriptions/{subscriptionId}/status:
 *   get:
 *     summary: Get subscription status and details
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Subscription status and details
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Subscription not found
 */
router.get('/:subscriptionId/status', requireAuth, getSubscriptionStatus);

/**
 * @swagger
 * /api/subscriptions/{subscriptionId}/renew:
 *   put:
 *     summary: Renew an existing subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Subscription renewed successfully
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Subscription not found
 */
router.put('/:subscriptionId/renew', requireAuth, renewSubscription);

export default router;
