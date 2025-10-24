import express from 'express';
import {
  importFromGmail,
  getContacts,
  getTop5,
  addContact
} from '../controllers/contactsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/import', importFromGmail);
router.get('/', getContacts);
router.get('/top5', getTop5);
router.post('/', addContact);

export default router;