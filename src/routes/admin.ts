import { Router } from 'express';
import { 
  getPendingPayments, 
  approvePayment, 
  rejectPayment,
  getAllUsers,
  updateUserStatus,
  getAllSubscriptions,
  getAccessLogs,
  getDashboardAnalytics
} from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only endpoints
 */

/**
 * @swagger
 * /api/admin/pending-payments:
 *   get:
 *     summary: Get all pending payments
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of pending payments
 *       '401':
 *         description: Unauthorized
 */
router.get('/pending-payments', authenticate, requireAdmin, getPendingPayments);

/**
 * @swagger
 * /api/admin/approve-payment/{paymentId}:
 *   put:
 *     summary: Approve a pending payment
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Payment approved successfully
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Payment not found
 */
router.put('/approve-payment/:paymentId', authenticate, requireAdmin, approvePayment);

/**
 * @swagger
 * /api/admin/reject-payment/{paymentId}:
 *   put:
 *     summary: Reject a pending payment
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Payment rejected successfully
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Payment not found
 */
router.put('/reject-payment/:paymentId', authenticate, requireAdmin, rejectPayment);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of all users
 *       '401':
 *         description: Unauthorized
 */
router.get('/users', authenticate, requireAdmin, getAllUsers);

/**
 * @swagger
 * /api/admin/user-status/{userId}:
 *   put:
 *     summary: Update a user's status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       '200':
 *         description: User status updated successfully
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: User not found
 */
router.put('/user-status/:userId', authenticate, requireAdmin, updateUserStatus);

/**
 * @swagger
 * /api/admin/subscriptions:
 *   get:
 *     summary: Get all subscriptions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of all subscriptions
 *       '401':
 *         description: Unauthorized
 */
router.get('/subscriptions', authenticate, requireAdmin, getAllSubscriptions);

/**
 * @swagger
 * /api/admin/access-logs:
 *   get:
 *     summary: Get all access logs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of all access logs
 *       '401':
 *         description: Unauthorized
 */
router.get('/access-logs', authenticate, requireAdmin, getAccessLogs);

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get dashboard analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Dashboard analytics data
 *       '401':
 *         description: Unauthorized
 */
router.get('/analytics', authenticate, requireAdmin, getDashboardAnalytics);

export default router;
