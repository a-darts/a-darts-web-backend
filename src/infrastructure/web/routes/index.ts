import { Router } from 'express';
import { getHealth } from '../controllers/healthController.js';
import { UserController } from '../controllers/UserController.js';
import { AuthController } from '../controllers/AuthController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { PlayerController } from '../controllers/PlayerController.js';
import { TournamentController } from '../controllers/TournamentController.js';
import { isAdmin, isSelfOrAdmin } from '../middlewares/authorizer.js';
import { MatchController } from '../controllers/MatchController.js';

const router = Router();
const userController = new UserController();
const authController = new AuthController();
const playerController = new PlayerController();
const tournamentController = new TournamentController();
const matchController = new MatchController();

// Health check route
router.get('/health', getHealth);

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authMiddleware, authController.logout);
router.get('/auth/me', authMiddleware, authController.getMe);

// User routes
router.put('/users/:id/email', authMiddleware, isSelfOrAdmin, userController.updateEmail);
router.put('/users/:id/password', authMiddleware, isSelfOrAdmin, userController.updatePassword);
router.put('/users/:id/alias', authMiddleware, isSelfOrAdmin, userController.updateAlias);

// Player routes
router.get('/players', authMiddleware, playerController.getAllPlayers);
router.get('/players/:id', authMiddleware, playerController.getPlayerData);
router.post('/players', authMiddleware, isAdmin, playerController.createPlayer);
router.put('/players/:id/federation', authMiddleware, isAdmin, playerController.updatePlayerFederation);

// Tournament routes
router.get('/tournaments', tournamentController.getAllTournaments);
router.get('/tournaments/:id', tournamentController.getTournamentById);
router.post('/tournaments', authMiddleware, isAdmin, tournamentController.createTournament);
router.put('/tournaments/:id/status', authMiddleware, isAdmin, tournamentController.updateTournamentStatus);
router.put('/tournaments/:id/info', authMiddleware, isAdmin, tournamentController.updateTournamentInfo);
router.put('/tournaments/:id/name', authMiddleware, isAdmin, tournamentController.updateTournamentName);
router.put('/tournaments/:id/registration/status', authMiddleware, isAdmin, tournamentController.updateTournamentRegistrationStatus);
router.put('/tournaments/:id/registration/schedule', authMiddleware, isAdmin, tournamentController.updateTournamentRegistrationPeriod);
router.post('/tournaments/:id/participants', authMiddleware, isAdmin, tournamentController.registerParticipant);
router.delete('/tournaments/:id/participants/:participantId', authMiddleware, isAdmin, tournamentController.unregisterParticipant);
router.post('/tournaments/:id/participants/:participantId/checkin', authMiddleware, isAdmin, tournamentController.doCheckInParticipant);
router.delete('/tournaments/:id/participants/:participantId/checkin', authMiddleware, isAdmin, tournamentController.undoCheckInParticipant);
router.get('/tournaments/:id/participants', tournamentController.getParticipantsByTournamentId);
router.get('/tournaments/:id/matches', tournamentController.getMatchesByTournamentId);
router.post('/tournaments/:id/matches', authMiddleware, isAdmin, tournamentController.createMatch);

// Match routes
router.get('/matches/:id', matchController.getMatchById);
router.put('/matches/:id/status', authMiddleware, isAdmin, matchController.updateMatchStatus);
router.put('/matches/:id/boardNumber', authMiddleware, isAdmin, matchController.updateMatchBoardNumber);


export default router;
