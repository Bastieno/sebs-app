import { Router } from 'express';
import { getPendingApprovals, approveSubscription, rejectSubscription } from '../controllers/adminController';
import { authenticate } from '@/middleware/auth';
import { isAdmin, isSuperAdmin } from '@/middleware/roles';

const router = Router();

router.get('/approvals', authenticate, isAdmin, getPendingApprovals);
router.patch('/subscriptions/:subscriptionId/approve', authenticate, isAdmin, approveSubscription);
router.patch('/subscriptions/:subscriptionId/reject', authenticate, isAdmin, rejectSubscription);

// Example of a super admin only route
router.delete('/users/:userId', authenticate, isSuperAdmin, (req, res) => {
  res.json({ message: `User ${req.params.userId} deleted by super admin` });
});

export default router;
