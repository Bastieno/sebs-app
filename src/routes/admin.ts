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
import { requireAdmin } from '../middleware/auth';

const router = Router();

// Payment and Subscription Management
router.get('/pending-payments', requireAdmin, getPendingPayments);
router.put('/approve-payment/:paymentId', requireAdmin, approvePayment);
router.put('/reject-payment/:paymentId', requireAdmin, rejectPayment);

// User Management
router.get('/users', requireAdmin, getAllUsers);
router.put('/user-status/:userId', requireAdmin, updateUserStatus);

// Data Viewing
router.get('/subscriptions', requireAdmin, getAllSubscriptions);
router.get('/access-logs', requireAdmin, getAccessLogs);

// Analytics
router.get('/analytics', requireAdmin, getDashboardAnalytics);

export default router;
