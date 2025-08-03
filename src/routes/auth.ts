import { Router } from 'express';
import { register, login, getProfile, changePassword, logout } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { name, email, phone, password }
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get('/profile', requireAuth, getProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    { currentPassword, newPassword }
 */
router.put('/change-password', requireAuth, changePassword);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token deletion)
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.post('/logout', requireAuth, logout);

export default router;
