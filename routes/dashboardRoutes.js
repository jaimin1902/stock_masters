import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, dashboardController.getDashboard);

export default router;

