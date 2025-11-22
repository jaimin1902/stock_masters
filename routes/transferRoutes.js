import express from 'express';
import * as transferController from '../controllers/transferController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, transferController.getAllTransfers);
router.get('/:id', authenticate, transferController.getTransferById);
router.post('/', authenticate, transferController.createTransfer);
router.post('/:id/validate', authenticate, transferController.validateTransfer);

export default router;

