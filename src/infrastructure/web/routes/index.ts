import { Router } from 'express';
import { getHealth } from '../controllers/healthController.js';
import { UserController } from '../controllers/UserController.js';
import { AuthController } from '../controllers/AuthController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { optionalAuthMiddleware } from '../middlewares/optionalAuthMiddleware.js';
import { PlayerController } from '../controllers/PlayerController.js';
import { TournamentController } from '../controllers/TournamentController.js';
import { isAdmin, isSelfOrAdmin } from '../middlewares/authorizer.js';
import { MatchController } from '../controllers/MatchController.js';
import { BracketController } from '../controllers/BracketController.js';

const router = Router();
const userController = new UserController();
const authController = new AuthController();
const playerController = new PlayerController();
const tournamentController = new TournamentController();
const matchController = new MatchController();
const bracketController = new BracketController();

// Health check route
router.get('/health', getHealth);

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authMiddleware, authController.logout);
router.get('/auth/me', authMiddleware, authController.getMe);

// User routes
router.get('/users', authMiddleware, isAdmin, userController.getAllUsers);
router.get('/users/:id', authMiddleware, isAdmin, userController.getUserById);
router.post('/users', authMiddleware, isAdmin, userController.createUser);
router.put('/users/:id/email', authMiddleware, isSelfOrAdmin, userController.updateEmail);
router.put('/users/:id/password', authMiddleware, isSelfOrAdmin, userController.updatePassword);
router.put('/users/:id/alias', authMiddleware, isSelfOrAdmin, userController.updateAlias);

// Player routes
router.get('/players', authMiddleware, playerController.getAllPlayers);
router.get('/players/:id', authMiddleware, playerController.getPlayerData);
router.get('/players/user/:userId/season/:seasonStartYear', authMiddleware, playerController.getPlayerByUserIdAndSeason);
router.post('/players', authMiddleware, isAdmin, playerController.createPlayer);
router.put('/players/:id/federation', authMiddleware, isAdmin, playerController.updatePlayerFederation);

// Tournament routes
router.get('/tournaments', optionalAuthMiddleware, tournamentController.getAllTournaments);
router.get('/tournaments/:id', optionalAuthMiddleware, tournamentController.getTournamentById);
router.post('/tournaments', authMiddleware, isAdmin, tournamentController.createTournament);

router.post('/tournaments/:id/unpublish', authMiddleware, isAdmin, tournamentController.unpublishTournament);
router.post('/tournaments/:id/publish', authMiddleware, isAdmin, tournamentController.publishTournament);
router.post('/tournaments/:id/cancel', authMiddleware, isAdmin, tournamentController.cancelTournament);
router.post('/tournaments/:id/start', authMiddleware, isAdmin, tournamentController.startTournament);

router.post('/tournaments/:id/registration/open', authMiddleware, isAdmin, tournamentController.openRegistration);
router.post('/tournaments/:id/registration/close', authMiddleware, isAdmin, tournamentController.closeRegistration);
router.put('/tournaments/:id/registration/schedule', authMiddleware, isAdmin, tournamentController.updateTournamentRegistrationPeriod);

router.put('/tournaments/:id/info', authMiddleware, isAdmin, tournamentController.updateTournamentInfo);
router.put('/tournaments/:id/name', authMiddleware, isAdmin, tournamentController.updateTournamentName);
router.post('/tournaments/:id/participants', authMiddleware, isSelfOrAdmin, tournamentController.registerParticipant);
router.delete('/tournaments/:id/participants/:participantId', authMiddleware, isSelfOrAdmin, tournamentController.unregisterParticipant);
router.post('/tournaments/:id/participants/:participantId/checkIn', authMiddleware, isAdmin, tournamentController.doCheckInParticipant);
router.delete('/tournaments/:id/participants/:participantId/checkIn', authMiddleware, isAdmin, tournamentController.undoCheckInParticipant);
router.get('/tournaments/:id/unregisteredPlayers', authMiddleware, isAdmin, tournamentController.getUnregisteredPlayersByTournamentId);
router.get('/tournaments/:id/participants', tournamentController.getParticipantsByTournamentId);
router.get('/tournaments/:id/matches', tournamentController.getMatchesByTournamentId);
router.post('/tournaments/:id/bracket/automatic', authMiddleware, isAdmin, tournamentController.createBracketAutomatically);
router.post('/tournaments/:id/bracket/manual', authMiddleware, isAdmin, tournamentController.createBracketManually);
router.get('/tournaments/:id/bracket', optionalAuthMiddleware, tournamentController.getTournamentBracket);


// Match routes
router.get('/matches/:id', matchController.getMatchById);
router.post('/matches/:id/start', authMiddleware, isAdmin, matchController.startMatch);
router.post('/matches/:id/finish', authMiddleware, isAdmin, matchController.finishMatch);
router.post('/matches/:id/cancel', authMiddleware, isAdmin, matchController.cancelMatch);
router.post('/matches/:id/suspend', authMiddleware, isAdmin, matchController.suspendMatch);
router.post('/matches/:id/resume', authMiddleware, isAdmin, matchController.resumeMatch);
router.put('/matches/:id/boardNumber', authMiddleware, isAdmin, matchController.updateMatchBoardNumber);
router.post('/matches/:id/sets', authMiddleware, isAdmin, matchController.registerSetWin);
router.post('/matches/:id/legs', authMiddleware, isAdmin, matchController.registerLegWin);

// Bracket routes
router.put('/brackets/:id/swapPositions', authMiddleware, isAdmin, bracketController.swapPositions);
router.put('/brackets/:id/setupPositions', authMiddleware, isAdmin, bracketController.setupPositions);
router.post('/brackets/:id/reshuffle', authMiddleware, isAdmin, bracketController.reshuffleBracket);
router.post('/brackets/:id/unpublish', authMiddleware, isAdmin, bracketController.unpublishBracket);
router.post('/brackets/:id/publish', authMiddleware, isAdmin, bracketController.publishBracket);

export default router;
