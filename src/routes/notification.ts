import { Router } from 'express';
import { sendNotification, getNotifications, markNotificationAsRead } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/send', authenticate, sendNotification);
router.get('/', authenticate, getNotifications);
router.patch('/:notificationId/read', authenticate, markNotificationAsRead);

export default router;
