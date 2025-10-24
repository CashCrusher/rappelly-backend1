import express from 'express';
import {
  generateTemplate,
  sendEmail,
  scheduleEmail,
  getScheduledSends,
  deleteScheduledSend,
  getRelanceHistory
} from '../controllers/relanceController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/template', generateTemplate);
router.post('/send', sendEmail);
router.post('/schedule', scheduleEmail);
router.get('/scheduled', getScheduledSends);
router.delete('/scheduled/:id', deleteScheduledSend);
router.get('/history', getRelanceHistory);

export default router;