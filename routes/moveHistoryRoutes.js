import express from 'express';
import * as moveHistoryController from '../controllers/moveHistoryController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, moveHistoryController.getMoveHistory);

export default router;

