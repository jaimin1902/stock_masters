import express from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, categoryController.getAllCategories);
router.get('/:id', authenticate, categoryController.getCategoryById);
router.post('/', authenticate, categoryController.createCategory);
router.put('/:id', authenticate, categoryController.updateCategory);

export default router;

