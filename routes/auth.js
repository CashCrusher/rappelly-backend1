import express from 'express';
import { getAuthUrl, handleCallback, verifyToken } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/google', getAuthUrl);
router.get('/callback', handleCallback);
router.get('/verify', authenticateToken, verifyToken);

export default router;