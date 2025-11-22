import express from 'express';
import * as deliveryOrderController from '../controllers/deliveryOrderController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, deliveryOrderController.getAllDeliveryOrders);
router.get('/:id', authenticate, deliveryOrderController.getDeliveryOrderById);
router.post('/', authenticate, deliveryOrderController.createDeliveryOrder);
router.put('/:id', authenticate, deliveryOrderController.updateDeliveryOrder);
router.patch('/:id/status', authenticate, deliveryOrderController.updateDeliveryOrderStatus);
router.post('/:id/validate', authenticate, deliveryOrderController.validateDeliveryOrder);

export default router;

