import express from 'express';
import * as locationController from '../controllers/locationController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, locationController.getAllLocations);
router.get('/:id', authenticate, locationController.getLocationById);
router.post('/', authenticate, locationController.createLocation);
router.put('/:id', authenticate, locationController.updateLocation);
router.delete('/:id', authenticate, locationController.deleteLocation);

export default router;

