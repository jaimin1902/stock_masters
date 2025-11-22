import express from 'express';
import * as supplierController from '../controllers/supplierController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, supplierController.getAllSuppliers);
router.get('/:id', authenticate, supplierController.getSupplierById);
router.post('/', authenticate, supplierController.createSupplier);
router.put('/:id', authenticate, supplierController.updateSupplier);

export default router;

