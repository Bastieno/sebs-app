import { Router } from 'express';
import { sendNotification, getNotifications, markNotificationAsRead } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management endpoints
 */

/**
 * @swagger
 * /api/notifications/send:
 *   post:
 *     summary: Send a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - message
 *             properties:
 *               recipientId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Notification sent successfully
 *       '401':
 *         description: Unauthorized
 */
router.post('/send', authenticate, sendNotification);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications for the current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of notifications
 *       '401':
 *         description: Unauthorized
 */
router.get('/', authenticate, getNotifications);

/**
 * @swagger
 * /api/notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Notification marked as read
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Notification not found
 */
router.patch('/:notificationId/read', authenticate, markNotificationAsRead);

export default router;
