import { Router } from 'express';
import {
  createUser,
  updateUser,
  deleteUser,
  createPlan,
  updatePlan,
  getSystemStats,
  createStaff,
} from '../controllers/superAdminController';
import { authenticate, requireSuperAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireSuperAdmin);

/**
 * @swagger
 * tags:
 *   name: SuperAdmin
 *   description: Super Admin exclusive endpoints
 */

/**
 * @swagger
 * /api/super-admin/users:
 *   post:
 *     summary: Create a new user
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       '201':
 *         description: User created successfully
 *       '401':
 *         description: Unauthorized
 */
router.post('/users', createUser);

/**
 * @swagger
 * /api/super-admin/users/{id}:
 *   put:
 *     summary: Update a user
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       '200':
 *         description: User updated successfully
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: User not found
 */
router.put('/users/:id', updateUser);

/**
 * @swagger
 * /api/super-admin/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '204':
 *         description: User deleted successfully
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: User not found
 */
router.delete('/users/:id', deleteUser);

/**
 * @swagger
 * /api/super-admin/plans:
 *   post:
 *     summary: Create a new plan
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               duration:
 *                 type: number
 *     responses:
 *       '201':
 *         description: Plan created successfully
 *       '401':
 *         description: Unauthorized
 */
router.post('/plans', createPlan);

/**
 * @swagger
 * /api/super-admin/plans/{id}:
 *   put:
 *     summary: Update a plan
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               duration:
 *                 type: number
 *     responses:
 *       '200':
 *         description: Plan updated successfully
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Plan not found
 */
router.put('/plans/:id', updatePlan);

/**
 * @swagger
 * /api/super-admin/system-stats:
 *   get:
 *     summary: Get system statistics
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: System statistics
 *       '401':
 *         description: Unauthorized
 */
router.get('/system-stats', getSystemStats);

/**
 * @swagger
 * /api/super-admin/staff:
 *   post:
 *     summary: Create a new staff member
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Staff member created successfully
 *       '401':
 *         description: Unauthorized
 */
router.post('/staff', createStaff);

export default router;
