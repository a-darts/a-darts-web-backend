import { Router } from 'express';
import { getHealth } from '../controllers/healthController.js';
import { UserController } from '../controllers/UserController.js';
import { AuthController } from '../controllers/AuthController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();
const userController = new UserController();
const authController = new AuthController();

// Health check route
router.get('/health', getHealth);

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authMiddleware as any, authController.logout);
router.get('/auth/me', authMiddleware as any, authController.getMe);

// User routes
router.put('/users/email', authMiddleware as any, userController.updateEmail);
router.put('/users/password', authMiddleware as any, userController.updatePassword);
router.put('/users/alias', authMiddleware as any, userController.updateAlias);

export default router;
