import { Router } from 'express';
import { updateProfile } from '../controllers/userController';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile (name, phone)
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    { name, phone }
 */
router.put('/profile', requireAuth, updateProfile);

export default router;
