import express from 'express';
import * as warehouseController from '../controllers/warehouseController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, warehouseController.getAllWarehouses);
router.get('/:id', authenticate, warehouseController.getWarehouseById);
router.post('/', authenticate, warehouseController.createWarehouse);
router.put('/:id', authenticate, warehouseController.updateWarehouse);

export default router;

