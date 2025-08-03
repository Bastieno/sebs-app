import { Router } from 'express';
import { updateProfile } from '../controllers/userController';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User related endpoints
 */

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update user profile (name, phone)
 *     tags: [User]
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
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 example: "1234567890"
 *     responses:
 *       '200':
 *         description: Profile updated successfully
 *       '401':
 *         description: Unauthorized
 */
router.put('/profile', requireAuth, updateProfile);

export default router;
