import { Router } from 'express';
import { getAllPlans, getPlanById, getPlanPricing, createCustomPlan, updateCustomPlan, deleteCustomPlan } from '../controllers/plansController';
import { authenticate } from '../middleware/auth';
import { isAdmin } from '../middleware/roles';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Plans
 *   description: Plan management endpoints
 */

/**
 * @swagger
 * /api/plans:
 *   get:
 *     summary: Get all active plans
 *     tags: [Plans]
 *     responses:
 *       '200':
 *         description: A list of active plans
 */
router.get('/', getAllPlans);

/**
 * @swagger
 * /api/plans/pricing:
 *   get:
 *     summary: Get structured pricing information
 *     tags: [Plans]
 *     responses:
 *       '200':
 *         description: Structured pricing information
 */
router.get('/pricing', getPlanPricing);

/**
 * @swagger
 * /api/plans/{id}:
 *   get:
 *     summary: Get plan by ID with subscription count
 *     tags: [Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Plan details
 *       '404':
 *         description: Plan not found
 */
router.get('/:id', getPlanById);

/**
 * @swagger
 * /api/plans/custom:
 *   post:
 *     summary: Create a custom plan (Admin only)
 *     tags: [Plans]
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
 *               - price
 *               - timeStart
 *               - timeEnd
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               timeStart:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               timeEnd:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               notes:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Custom plan created successfully
 *       '400':
 *         description: Invalid input
 *       '401':
 *         description: Unauthorized
 */
router.post('/custom', authenticate, isAdmin, createCustomPlan);

/**
 * @swagger
 * /api/plans/custom/{id}:
 *   put:
 *     summary: Update a custom plan (Admin only)
 *     tags: [Plans]
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
 *               timeStart:
 *                 type: string
 *               timeEnd:
 *                 type: string
 *               notes:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       '200':
 *         description: Custom plan updated successfully
 *       '403':
 *         description: Cannot edit system plans
 *       '404':
 *         description: Plan not found
 */
router.put('/custom/:id', authenticate, isAdmin, updateCustomPlan);

/**
 * @swagger
 * /api/plans/custom/{id}:
 *   delete:
 *     summary: Delete a custom plan (Admin only)
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Custom plan deleted successfully
 *       '400':
 *         description: Cannot delete plan with active subscriptions
 *       '403':
 *         description: Cannot delete system plans
 *       '404':
 *         description: Plan not found
 */
router.delete('/custom/:id', authenticate, isAdmin, deleteCustomPlan);

export default router;
