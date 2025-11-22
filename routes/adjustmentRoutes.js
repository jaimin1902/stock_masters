import express from 'express';
import * as adjustmentController from '../controllers/adjustmentController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, adjustmentController.getAllAdjustments);
router.get('/:id', authenticate, adjustmentController.getAdjustmentById);
router.post('/', authenticate, adjustmentController.createAdjustment);

export default router;

