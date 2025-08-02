import { Router } from 'express';
import { getAllPlans, getPlanById, getPlanPricing } from '../controllers/plansController';

const router = Router();

/**
 * @route   GET /api/plans
 * @desc    Get all active plans
 * @access  Public
 */
router.get('/', getAllPlans);

/**
 * @route   GET /api/plans/pricing
 * @desc    Get structured pricing information
 * @access  Public
 */
router.get('/pricing', getPlanPricing);

/**
 * @route   GET /api/plans/:id
 * @desc    Get plan by ID with subscription count
 * @access  Public
 */
router.get('/:id', getPlanById);

export default router;
