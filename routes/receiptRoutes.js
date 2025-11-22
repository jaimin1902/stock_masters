import express from 'express';
import * as receiptController from '../controllers/receiptController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, receiptController.getAllReceipts);
router.get('/:id', authenticate, receiptController.getReceiptById);
router.post('/', authenticate, receiptController.createReceipt);
router.put('/:id', authenticate, receiptController.updateReceipt);
router.patch('/:id/status', authenticate, receiptController.updateReceiptStatus);
router.post('/:id/validate', authenticate, receiptController.validateReceipt);

export default router;

