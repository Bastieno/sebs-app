import { Router } from 'express';
import { 
  getPendingPayments, 
  approvePayment, 
  rejectPayment,
  getAllUsers,
  updateUserStatus,
  getAllSubscriptions,
  getAccessLogs,
  getDashboardAnalytics,
  approveSubscriptionDirectly,
  createUserManually,
  createAndActivateSubscription,
  getUserByAccessCode,
  getNotifications,
  markNotificationAsRead
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

/**
 * @swagger
 * /api/admin/approve-subscription/{subscriptionId}:
 *   put:
 *     summary: Approve subscription directly (no receipt required)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminNotes:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, BANK_TRANSFER, CARD, OTHER]
 *     responses:
 *       '200':
 *         description: Subscription approved successfully
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Subscription not found
 */
router.put('/approve-subscription/:subscriptionId', authenticate, requireAdmin, approveSubscriptionDirectly);

/**
 * @swagger
 * /api/admin/create-user:
 *   post:
 *     summary: Create a user manually (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '201':
 *         description: User created successfully
 *       '401':
 *         description: Unauthorized
 *       '409':
 *         description: User already exists
 */
router.post('/create-user', authenticate, requireAdmin, createUserManually);

/**
 * @swagger
 * /api/admin/create-subscription:
 *   post:
 *     summary: Create and activate subscription in one step (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - planId
 *               - startDate
 *             properties:
 *               userId:
 *                 type: string
 *               planId:
 *                 type: string
 *               timeSlot:
 *                 type: string
 *                 enum: [MORNING, AFTERNOON, NIGHT, ALL]
 *               startDate:
 *                 type: string
 *                 format: date
 *               paymentMethod:
 *                 type: string
 *               adminNotes:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Subscription created and activated successfully
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: User or plan not found
 */
router.post('/create-subscription', authenticate, requireAdmin, createAndActivateSubscription);

/**
 * @swagger
 * /api/admin/user-by-access-code/{accessCode}:
 *   get:
 *     summary: Get user and plan info by access code
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accessCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Subscription details retrieved successfully
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: No subscription found with this access code
 */
router.get('/user-by-access-code/:accessCode', authenticate, requireAdmin, getUserByAccessCode);

/**
 * @swagger
 * /api/admin/notifications:
 *   get:
 *     summary: Get all notifications
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Notifications retrieved successfully
 *       '401':
 *         description: Unauthorized
 */
router.get('/notifications', authenticate, requireAdmin, getNotifications);

/**
 * @swagger
 * /api/admin/notifications/{notificationId}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Admin]
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
 */
router.put('/notifications/:notificationId/read', authenticate, requireAdmin, markNotificationAsRead);

export default router;
