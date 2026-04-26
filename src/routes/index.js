import { Router } from 'express';
import { getHealth } from '../controllers/healthController.js';

const router = Router();

// Health check route
router.get('/health', getHealth);

// Add more routes here
// router.use('/users', userRouter);

export default router;
