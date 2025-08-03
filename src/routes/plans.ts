import { Router } from 'express';
import { getAllPlans, getPlanById, getPlanPricing } from '../controllers/plansController';

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

export default router;
