import { Router } from 'express';
import { getHealth } from '../controllers/healthController.js';
import { UserController } from '../controllers/UserController.js';
import { AuthController } from '../controllers/AuthController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { PlayerController } from '../controllers/PlayerController.js';
import { TournamentController } from '../controllers/TournamentController.js';

const router = Router();
const userController = new UserController();
const authController = new AuthController();
const playerController = new PlayerController();
const tournamentController = new TournamentController();

// Health check route
router.get('/health', getHealth);

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authMiddleware, authController.logout);
router.get('/auth/me', authMiddleware, authController.getMe);

// User routes
router.put('/users/email', authMiddleware, userController.updateEmail);
router.put('/users/password', authMiddleware, userController.updatePassword);
router.put('/users/alias', authMiddleware, userController.updateAlias);

// Player routes
router.get('/players', authMiddleware, playerController.getAllPlayers);
router.get('/players/:userId', authMiddleware, playerController.getPlayerData);

// Tournament routes
router.get('/tournaments', authMiddleware, tournamentController.getAllTournaments);

export default router;
