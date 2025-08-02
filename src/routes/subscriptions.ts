import { Router } from 'express';
import { 
  applyForSubscription, 
  uploadPaymentReceipt, 
  getUserSubscriptions, 
  getSubscriptionQRCode, 
  getSubscriptionStatus 
} from '../controllers/subscriptionController';
import { requireAuth } from '../middleware/auth';
import { uploadReceipt, handleUploadError } from '../middleware/upload';

const router = Router();

/**
 * @route   POST /api/subscriptions/apply
 * @desc    Apply for a new subscription
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    { planId, timeSlot?, startDate }
 */
router.post('/apply', requireAuth, applyForSubscription);

/**
 * @route   POST /api/subscriptions/:subscriptionId/upload-receipt
 * @desc    Upload payment receipt for subscription
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    FormData with 'receipt' file and 'amount' field
 */
router.post(
  '/:subscriptionId/upload-receipt', 
  requireAuth, 
  uploadReceipt, 
  handleUploadError, 
  uploadPaymentReceipt
);

/**
 * @route   GET /api/subscriptions
 * @desc    Get user's subscriptions
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get('/', requireAuth, getUserSubscriptions);

/**
 * @route   GET /api/subscriptions/:subscriptionId/qr-code
 * @desc    Get QR code for active subscription
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get('/:subscriptionId/qr-code', requireAuth, getSubscriptionQRCode);

/**
 * @route   GET /api/subscriptions/:subscriptionId/status
 * @desc    Get subscription status and details
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get('/:subscriptionId/status', requireAuth, getSubscriptionStatus);

export default router;
