import express from 'express';
import {
  getSettings,
  updateSettings,
  disconnectGmail
} from '../controllers/settingsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getSettings);
router.put('/', updateSettings);
router.post('/disconnect', disconnectGmail);

export default router;