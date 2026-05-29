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
import { PlayingAreaController } from '../controllers/PlayingAreaController.js';
import { RegisteredParticipantController } from '../controllers/RegisteredParticipantController.js';

const router = Router();
const userController = new UserController();
const authController = new AuthController();
const playerController = new PlayerController();
const tournamentController = new TournamentController();
const matchController = new MatchController();
const bracketController = new BracketController();
const playingAreaController = new PlayingAreaController();
const registeredParticipantController = new RegisteredParticipantController();

// Health check route
router.get('/health', getHealth);

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authMiddleware, authController.logout);
router.get('/auth/me', authMiddleware, authController.getMe);
router.post('/auth/activate-account', authController.activateAccount);
router.post('/auth/forgot-password', authController.forgotPassword);


// User routes
router.get('/users', authMiddleware, isAdmin, userController.getAllUsers);
router.get('/users/:id', authMiddleware, isAdmin, userController.getUserById);
router.post('/users', authMiddleware, isAdmin, userController.createUser);
router.put('/users/:id/email', authMiddleware, isSelfOrAdmin, userController.updateEmail);
router.put('/users/:id/password', authMiddleware, isSelfOrAdmin, userController.updatePassword);
router.put('/users/:id/alias', authMiddleware, isSelfOrAdmin, userController.updateAlias);

router.post('/users/:id/block', authMiddleware, isAdmin, userController.blockUser);
router.post('/users/:id/unblock', authMiddleware, isAdmin, userController.unblockUser);
router.post('/users/:id/delete', authMiddleware, isAdmin, userController.deleteUser);
router.post('/users/:id/restore', authMiddleware, isAdmin, userController.restoreUser);


// Player routes
router.get('/players', authMiddleware, playerController.getAllPlayers);
router.get('/players/:id', authMiddleware, playerController.getPlayerById);
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

router.get('/tournaments/:id/unregisteredPlayers', authMiddleware, isAdmin, tournamentController.getUnregisteredPlayersByTournamentId);

router.post('/tournaments/:id/participants', authMiddleware, isSelfOrAdmin, registeredParticipantController.registerParticipant);
router.delete('/tournaments/:id/participants/:participantId', authMiddleware, isSelfOrAdmin, registeredParticipantController.unregisterParticipant);
router.post('/tournaments/:id/participants/:participantId/checkIn', authMiddleware, isAdmin, registeredParticipantController.doCheckInParticipant);
router.delete('/tournaments/:id/participants/:participantId/checkIn', authMiddleware, isAdmin, registeredParticipantController.undoCheckInParticipant);
router.get('/tournaments/:id/participants', registeredParticipantController.getParticipantsByTournamentId);

router.get('/tournaments/:id/matches', matchController.getMatchesByTournamentId);

router.post('/tournaments/:id/bracket/automatic', authMiddleware, isAdmin, bracketController.createBracketAutomatically);
router.post('/tournaments/:id/bracket/manual', authMiddleware, isAdmin, bracketController.createBracketManually);
router.get('/tournaments/:id/bracket', optionalAuthMiddleware, bracketController.getTournamentBracket);

router.get('/tournaments/:id/playing-areas', authMiddleware, isAdmin, playingAreaController.getTournamentPlayingArea);
router.post('/tournaments/:id/playing-areas', authMiddleware, isAdmin, playingAreaController.createTournamentPlayingArea);

router.get('/tournaments/:id/results', tournamentController.getTournamentResults);


// Match routes
router.get('/matches/:id', matchController.getMatchById);
router.post('/matches/:id/start', matchController.startMatch);
router.post('/matches/:id/finish', authMiddleware, isAdmin, matchController.finishMatch);
router.post('/matches/:id/cancel', authMiddleware, isAdmin, matchController.cancelMatch);
router.post('/matches/:id/suspend', authMiddleware, isAdmin, matchController.suspendMatch);
router.post('/matches/:id/resume', authMiddleware, isAdmin, matchController.resumeMatch);
router.put('/matches/:id/boardNumber', authMiddleware, isAdmin, matchController.setMatchBoardNumber);
router.put('/matches/:id/score', authMiddleware, isAdmin, matchController.updateMatchScore);
router.post('/matches/:id/result', authMiddleware, isAdmin, matchController.setMatchResult);

// Bracket routes
router.put('/brackets/:id/setupPositions', authMiddleware, isAdmin, bracketController.setupPositions);
router.post('/brackets/:id/reshuffle', authMiddleware, isAdmin, bracketController.reshuffleBracket);
router.post('/brackets/:id/unpublish', authMiddleware, isAdmin, bracketController.unpublishBracket);
router.post('/brackets/:id/publish', authMiddleware, isAdmin, bracketController.publishBracket);
router.delete('/brackets/:id', authMiddleware, isAdmin, bracketController.deleteBracket);

// PlayingArea routes
router.post('/playing-areas/:id/boards/:boardNumber/release', authMiddleware, isAdmin, playingAreaController.releasePlayingAreaBoard);
router.post('/playing-areas/:id/boards/:boardNumber/disable', authMiddleware, isAdmin, playingAreaController.disablePlayingAreaBoard);
router.post('/playing-areas/:id/boards/:boardNumber/enable', authMiddleware, isAdmin, playingAreaController.enablePlayingAreaBoard);
router.post('/playing-areas/:id/boards', authMiddleware, isAdmin, playingAreaController.addBoardInPlayingArea);
router.delete('/playing-areas/:id/boards/last', authMiddleware, isAdmin, playingAreaController.removeLastBoardFromPlayingArea);


export default router;
