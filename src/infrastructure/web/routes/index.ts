import { Router } from 'express';
import { getHealth } from '../controllers/healthController.js';
import { UserController } from '../controllers/UserController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();
const userController = new UserController();

// Health check route
router.get('/health', getHealth);

// User routes
router.post('/users/register', userController.register);
router.post('/users/login', userController.login);
router.post('/users/logout', userController.logout);
router.get('/users/me', authMiddleware as any, userController.getMe);

export default router;
