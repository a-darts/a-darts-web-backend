import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { prisma } from '../../persistence/client.js';
import { ApiResponseBuilder } from '../../../application/dtos/common/ApiResponse.js';
import { GetAllTournaments } from '../../../application/services/tournament/GetAllTournaments.js';
import { PrismaTournamentRepository } from '../../persistence/repositories/PrismaTournamentRepository.js';
import { TournamentStatus } from '../../../domain/entities/Tournament.js';
import { InvalidTournamentStatusUpdateException, TournamentAlreadyFinishedException, TournamentNotFoundException, TournamentNotInDraftException, TournamentNotInProgressException, TournamentNotPublishedException } from '../../../domain/exceptions/TournamentExceptions.js';
import { MissingRequiredUserFieldsException } from '../../../domain/exceptions/UserExceptions.js';
import { CreateTournament } from '../../../application/services/tournament/CreateTournament.js';
import { InvalidRegistrationPeriodException, InvalidRegistrationStatusException, RegistrationAlreadyClosedException, RegistrationAlreadyOpenException, RegistrationNotClosedException } from '../../../domain/exceptions/RegistrationExceptions.js';
import { UpdateTournamentInfo } from '../../../application/services/tournament/UpdateTournamentInfo.js';
import { UpdateTournamentName } from '../../../application/services/tournament/UpdateTournamentName.js';
import { UpdateTournamentRegistrationStatus } from '../../../application/services/tournament/registration/UpdateTournamentRegistrationStatus.js';
import { UpdateTournamentRegistrationPeriod } from '../../../application/services/tournament/registration/UpdateTournamentRegistrationPeriod.js';
import { RegisterParticipantInTournament } from '../../../application/services/tournament/registration/RegisterParticipantInTournament.js';
import { PrismaRegisteredParticipantRepository } from '../../persistence/repositories/PrismaRegisteredParticipantRepository.js';
import { PrismaPlayerRepository } from '../../persistence/repositories/PrismaPlayerRepository.js';
import { InvalidRegisteredPlayerSeasonException, PlayerNotFoundException } from '../../../domain/exceptions/PlayerExceptions.js';
import { ParticipantAlreadyCheckedInException, ParticipantAlreadyRegisteredException, ParticipantNotCheckedInException, ParticipantNotRegisteredException, RegisteredParticipantNotFoundException, RegistratedParticipantsEmptyException, RegistratedParticipantsNotEnoughException } from '../../../domain/exceptions/ParticipantExceptions.js';
import { MatchAlreadyExistsException, MatchAlreadyFinishedException, ParticipantNotRegisteredInTournamentException } from '../../../domain/exceptions/MatchExceptions.js';
import { UnregisterParticipantFromTournament } from '../../../application/services/tournament/registration/UnregisterParticipantFromTournament.js';
import { DoCheckInParticipant } from '../../../application/services/tournament/registration/DoCheckInParticipant.js';
import { UndoCheckInParticipant } from '../../../application/services/tournament/registration/UndoCheckInParticipant.js';
import { GetTournamentById } from '../../../application/services/tournament/GetTournamentById.js';
import { GetParticipantsByTournamentId } from '../../../application/services/tournament/registration/GetParticipantsByTournamentId.js';
import { PrismaUserRepository } from '../../persistence/repositories/PrismaUserRepository.js';
import { GetMatchesByTournamentId } from '../../../application/services/tournament/matches/GetMatchesByTournamentId.js';
import { PrismaMatchRepository } from '../../persistence/repositories/PrismaMatchRepository.js';
// import { CreateMatch } from '../../../application/services/tournament/matches/CreateMatch.js';
import { CreateBracket } from '../../../application/services/bracket/CreateBracket.js';
import { PrismaBracketRepository } from '../../persistence/repositories/PrismaBracketRepository.js';
import { BracketAlreadyExistsException, BracketAlreadyFinishedException, BracketNotFoundException, BracketNotInDraftException, BracketNotInDraftOrPublisedException, BracketNotInProgressException, BracketNotPublishedException } from '../../../domain/exceptions/BracketExceptions.js';
import { StartTournament } from '../../../application/services/tournament/StartTournament.js';
import { PublishTournament } from '../../../application/services/tournament/PublishTournament.js';
import { CancelTournament } from '../../../application/services/tournament/CancelTournament.js';
import { PrismaUnitOfWork } from '../../persistence/PrismaUnitOfWork.js';
import { UnpublishTournament } from '../../../application/services/tournament/UnpublishTournament.js';
import { OpenRegistration } from '../../../application/services/tournament/registration/OpenRegistration.js';
import { CloseRegistration } from '../../../application/services/tournament/registration/CloseRegistration.js';
import { GetTournamentBracket } from '../../../application/services/tournament/GetTournamentBracket.js';
import { UserRoles } from '../../../domain/entities/User.js';
import { GetElegiblePlayersByTournamentId } from '../../../application/services/tournament/GetElegiblePlayersByTournamentId.js';


const unitOfWork = new PrismaUnitOfWork(prisma);


const tournamentRepository = new PrismaTournamentRepository(prisma);
const registeredParticipantRepository = new PrismaRegisteredParticipantRepository(prisma);
const playerRepository = new PrismaPlayerRepository(prisma);
const userRepository = new PrismaUserRepository(prisma);
const matchRepository = new PrismaMatchRepository(prisma);
const bracketRepository = new PrismaBracketRepository(prisma);


const getAllTournaments = new GetAllTournaments(tournamentRepository);
const getTournamentById = new GetTournamentById(tournamentRepository);
const createTournament = new CreateTournament(tournamentRepository);
const unpublishTournament = new UnpublishTournament(unitOfWork, tournamentRepository, bracketRepository);
const publishTournament = new PublishTournament(unitOfWork, tournamentRepository, bracketRepository);
const startTournament = new StartTournament(unitOfWork, tournamentRepository, bracketRepository, matchRepository);
const cancelTournament = new CancelTournament(unitOfWork, tournamentRepository, bracketRepository, matchRepository);
const updateTournamentInfo = new UpdateTournamentInfo(tournamentRepository);
const updateTournamentName = new UpdateTournamentName(tournamentRepository);
const openRegistration = new OpenRegistration(tournamentRepository);
const closeRegistration = new CloseRegistration(tournamentRepository);
const updateTournamentRegistrationPeriod = new UpdateTournamentRegistrationPeriod(tournamentRepository);
const registerParticipantInTournament = new RegisterParticipantInTournament(tournamentRepository, registeredParticipantRepository, playerRepository, userRepository);
const unregisterParticipantFromTournament = new UnregisterParticipantFromTournament(tournamentRepository, registeredParticipantRepository);
const doCheckInParticipant = new DoCheckInParticipant(tournamentRepository, registeredParticipantRepository);
const undoCheckInParticipant = new UndoCheckInParticipant(tournamentRepository, registeredParticipantRepository);
const getParticipantsByTournamentId = new GetParticipantsByTournamentId(tournamentRepository, registeredParticipantRepository, playerRepository, userRepository);
const getMatchesByTournamentId = new GetMatchesByTournamentId(tournamentRepository, matchRepository);
// const createMatch = new CreateMatch(tournamentRepository, registeredParticipantRepository, matchRepository);
const createBracket = new CreateBracket(bracketRepository, tournamentRepository, registeredParticipantRepository);
const getTournamentBracket = new GetTournamentBracket(tournamentRepository, bracketRepository);
const getElegiblePlayersByTournamentId = new GetElegiblePlayersByTournamentId(tournamentRepository, registeredParticipantRepository, playerRepository);

/**
 * @swagger
 * components:
 *   schemas:
 *     Tournament:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *         name:
 *           type: string
 *           example: Campeonato de España Individual Femenino
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-04-04T13:10:16.841Z
 *         status:
 *           type: string
 *           example: PUBLISHED
 *         info:
 *           $ref: '#/components/schemas/TournamentInfo'
 *         registration:
 *           $ref: '#/components/schemas/Registration'
 * 
 *     TournamentInfo:
 *       type: object
 *       properties:
 *         place:
 *           type: string
 *           example: Hotel Verona, Puertollano
 *         dateTime:
 *           type: string
 *           format: date-time
 *           example: 2026-05-02T11:00:00.000Z
 *         mode:
 *           type: string
 *           example: WOMEN_SINGLES
 *         game:
 *           type: string
 *           example: 501
 *         schedule:
 *           type: string
 *           example: KO
 *         maxPlayers:
 *           type: number
 *           example: 300
 *         gameType:
 *           type: string
 *           example: BEST_OF
 *         numLegs:
 *           type: number
 *           example: 5
 *         numSets:
 *           type: number
 *           example: 1
 *         rules:
 *           type: string
 *           example: La salida será por aproximación
 *         info:
 *           type: string
 *           example: For more information, visit https://example.com
 *         federation:
 *           type: string
 *           example: ESPAÑA
 * 
 *     Registration:
 *       type: object
 *       properties:
 *         hasCheckIn:
 *           type: boolean
 *           example: true
 *         status:
 *           type: string
 *           example: CLOSED
 *         registrationPeriod:
 *           type: object
 *           properties:
 *             startsAt:
 *               type: string
 *               format: date-time
 *               example: 2026-05-02T11:00:00.000Z
 *             endsAt:
 *               type: string
 *               format: date-time
 *               example: 2026-05-02T11:00:00.000Z
 *         registeredParticipantsIds:
 *           type: array
 *           items:
 *             type: string
 *           example: ["1", "2", "3"]
 * 
 *     RegisteredParticipant:
 *       type: array
 *       items:
 *         type: object
 *         properties:
 *           id:
 *             type: string
 *             example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *           playerId:
 *             type: string
 *             example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *           registeredAt:
 *             type: string
 *             format: date-time
 *             example: 2026-05-02T11:00:00.000Z
 *           checkedInAt:
 *             type: string | null
 *             format: date-time
 *             example: 2026-05-02T12:00:00.000Z
 *           alias:
 *             type: string
 *             example: Pepe Pérez
 *           federation:
 *             type: string
 *             example: ARAGON
 * 
 *     Match:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *         round:
 *           type: number
 *           example: 1
 *         boardNumber:
 *           type: number
 *           example: 4
 *         startedAt:
 *           type: string
 *           format: date-time
 *           example: 2026-05-02T11:00:00.000Z
 *         finishedAt:
 *           type: string
 *           format: date-time
 *           example: 2026-05-02T12:00:00.000Z
 *         status:
 *           type: string
 *           example: FINISHED
 *         participant1:
 *           type: object
 *           properties:
 *             id:          
 *               type: string
 *               example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *             alias:
 *               type: string
 *               example: Jugador 1
 *             federation:
 *               type: string
 *               example: ARAGON
 *         participant2:
 *           type: object
 *           properties:
 *             id:          
 *               type: string
 *               example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *             alias:
 *               type: string
 *               example: Jugador 2
 *             federation:
 *               type: string
 *               example: ARAGON
 *         matchScore:
 *           type: object
 *           properties:
 *             participant1:
 *               type: object
 *               properties:
 *                 setsWon:
 *                   type: number
 *                   example: 0
 *                 legsWon:
 *                   type: number
 *                   example: 2
 *             participant2:
 *               type: object
 *               properties:
 *                 setsWon:
 *                   type: number
 *                   example: 0
 *                 legsWon:
 *                   type: number
 *                   example: 1
 *         tournamentId:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 * 
 *     Bracket:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *         tournamentId:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *         status:
 *           type: string
 *           example: DRAFT
 *         totalPositions:
 *           type: number
 *           example: 1
 *         positions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               position:
 *                 type: number
 *                 example: 1
 *               participantId:
 *                 type: string
 *                 example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *               participantAlias:
 *                 type: string
 *                 example: Pepe
 *               participantFederation:
 *                 type: string
 *                 example: ARAGON
 * 
 *     CreateTournamentRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Campeonato de España Individual Femenino
 *         info:
 *           $ref: '#/components/schemas/TournamentInfo'
 *
 *     UpdateTournamentInfoRequest:
 *       type: object
 *       required:
 *         - newInfo
 *       properties:
 *         newInfo:
 *           $ref: '#/components/schemas/TournamentInfo'
 * 
 *     UpdateTournamentNameRequest:
 *       type: object
 *       required:
 *         - newName
 *       properties:
 *         newName:
 *           type: string
 *           example: Nuevo nombre del campeonato
 * 
 *     UpdateTournamentRegistrationStatusRequest:
 *       type: object
 *       required:
 *         - newRegistrationStatus
 *       properties:
 *         newRegistrationStatus:
 *           type: string
 *           enum: [OPEN, CLOSED]
 *           example: OPEN
 * 
 *     UpdateTournamentRegistrationPeriodRequest:
 *       type: object
 *       required:
 *         - newRegistrationPeriod
 *       properties:
 *         newRegistrationPeriod:
 *           type: object
 *           properties:
 *             startsAt:
 *               type: string
 *               format: date-time
 *               example: 2026-05-02T11:00:00.000Z
 *             endsAt:
 *               type: string
 *               format: date-time
 *               example: 2026-05-02T11:00:00.000Z
 * 
 *     RegisterParticipantInTournamentRequest:
 *       type: object
 *       required:
 *         - playerId
 *       properties:
 *         playerId:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 * 
 *     CreateMatchRequest:
 *       type: object
 *       required:
 *         - participant1Id
 *         - participant2Id
 *         - round
 *       properties:
 *         participant1Id:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *         participant2Id:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *         round:
 *           type: number
 *           example: 1
 *         boardNumber:
 *           type: number
 *           example: 4
 */
export class TournamentController {

  /**
   * @swagger
   * /api/tournaments:
   *   get:
   *     summary: Get all tournaments
   *     tags: [Tournaments]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Tournaments fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Tournaments fetched successfully
   *                 data:
   *                   $ref: '#/components/schemas/Tournament'
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Internal server error
   */
  async getAllTournaments(req: AuthRequest, res: Response) {
    try {
      let tournaments = await getAllTournaments.execute();

      // Filter DRAFT tournaments if not ADMIN
      const isAdmin = req.user?.role === UserRoles.ADMIN;
      if (!isAdmin) {
        tournaments = tournaments.filter(t => t.status !== TournamentStatus.DRAFT);
      }

      res.status(200).json(
        ApiResponseBuilder.success(
          tournaments,
          'Tournaments fetched successfully',
        )
      );
    } catch (error: any) {
      console.error('[ERROR]:', error);
      res.status(500).json(
        ApiResponseBuilder.error('Internal server error')
      );
    }
  }


  /**
   * @swagger
   * /api/tournaments/{id}:
   *   get:
   *     summary: Get tournament by id
   *     tags: [Tournaments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Tournament ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     responses:
   *       200:
   *         description: Tournament fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Tournament fetched successfully
   *                 data:
   *                   $ref: '#/components/schemas/Tournament'
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: All fields are required
   *       404:
   *         description: Not Found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament not found
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Internal server error
   */
  async getTournamentById(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      let tournament = await getTournamentById.execute(id);

      // Filter DRAFT tournament if not ADMIN
      const isAdmin = req.user?.role === UserRoles.ADMIN;
      if (!isAdmin && tournament.status === TournamentStatus.DRAFT) {
        throw new TournamentNotFoundException();
      }

      res.status(200).json(
        ApiResponseBuilder.success(
          tournament,
          'Tournament fetched successfully',
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof TournamentNotFoundException) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }

      console.error('[ERROR]:', error);
      res.status(500).json(
        ApiResponseBuilder.error('Internal server error')
      );
    }
  }


  /**
   * @swagger
   * /api/tournaments:
   *   post:
   *     summary: Create a new tournament
   *     tags: [Tournaments]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateTournamentRequest'
   *     responses:
   *       201:
   *         description: Tournament created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Tournament created successfully
   *                 data:
   *                   $ref: '#/components/schemas/Tournament'
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: All fields are required
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: No token provided
   *       403:
   *         description: Forbidden
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: You do not have permission to perform this action
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Internal server error
   */
  async createTournament(req: AuthRequest, res: Response) {
    try {
      const tournament = await createTournament.execute(req.body);
      res.status(201).json(
        ApiResponseBuilder.success(
          tournament,
          'Tournament created successfully',
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }

      console.error('[ERROR]:', error);
      res.status(500).json(
        ApiResponseBuilder.error('Internal server error')
      );
    }
  }


  /**
   * @swagger
   * /api/tournaments/{id}/unpublish:
   *   post:
   *     summary: Unpublish tournament
   *     tags: [Tournaments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Tournament ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     responses:
   *       200:
   *         description: Tournament unpublished successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Tournament unpublished successfully
   *                 data:
   *                   type: string
   *                   example: null
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: All fields are required
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: No token provided
   *       403:
   *         description: Forbidden
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: You do not have permission to perform this action
   *       404:
   *         description: Not Found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament not found
   *       409:
   *         description: Conflict
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament is not published
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Internal server error
   */
  async unpublishTournament(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      await unpublishTournament.execute(id);
      res.status(200).json(
        ApiResponseBuilder.success(
          null,
          'Tournament unpublished successfully',
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof TournamentNotFoundException) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof TournamentNotPublishedException ||
        error instanceof BracketNotPublishedException
      ) {
        return res.status(409).json(
          ApiResponseBuilder.error(error.message)
        );
      }

      console.error('[ERROR]:', error);
      res.status(500).json(
        ApiResponseBuilder.error('Internal server error')
      );
    }
  }


  /**
   * @swagger
   * /api/tournaments/{id}/publish:
   *   post:
   *     summary: Publish tournament
   *     tags: [Tournaments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Tournament ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     responses:
   *       200:
   *         description: Tournament published successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Tournament published successfully
   *                 data:
   *                   type: string
   *                   example: null
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: All fields are required
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: No token provided
   *       403:
   *         description: Forbidden
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: You do not have permission to perform this action
   *       404:
   *         description: Not Found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament not found
   *       409:
   *         description: Conflict
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament is not in draft
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Internal server error
   */
  async publishTournament(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      await publishTournament.execute(id);
      res.status(200).json(
        ApiResponseBuilder.success(
          null,
          'Tournament published successfully',
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof TournamentNotFoundException) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof TournamentNotInDraftException ||
        error instanceof BracketNotInDraftException
      ) {
        return res.status(409).json(
          ApiResponseBuilder.error(error.message)
        );
      }

      console.error('[ERROR]:', error);
      res.status(500).json(
        ApiResponseBuilder.error('Internal server error')
      );
    }
  }


  /**
   * @swagger
   * /api/tournaments/{id}/cancel:
   *   post:
   *     summary: Cancel tournament
   *     tags: [Tournaments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Tournament ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     responses:
   *       200:
   *         description: Tournament cancelled successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Tournament cancelled successfully
   *                 data:
   *                   type: string
   *                   example: null
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: All fields are required
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: No token provided
   *       403:
   *         description: Forbidden
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: You do not have permission to perform this action
   *       404:
   *         description: Not Found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament not found
   *       409:
   *         description: Conflict
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament is already finished
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Internal server error
   */
  async cancelTournament(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      await cancelTournament.execute(id);
      res.status(200).json(
        ApiResponseBuilder.success(
          null,
          'Tournament cancelled successfully',
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof TournamentNotFoundException) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof TournamentAlreadyFinishedException ||
        error instanceof BracketAlreadyFinishedException ||
        error instanceof MatchAlreadyFinishedException
      ) {
        return res.status(409).json(
          ApiResponseBuilder.error(error.message)
        );
      }

      console.error('[ERROR]:', error);
      res.status(500).json(
        ApiResponseBuilder.error('Internal server error')
      );
    }
  }


  /**
   * @swagger
   * /api/tournaments/{id}/start:
   *   post:
   *     summary: Start tournament
   *     tags: [Tournaments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Tournament ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     responses:
   *       200:
   *         description: Tournament started successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Tournament started successfully
   *                 data:
   *                   type: string
   *                   example: null
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: All fields are required
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: No token provided
   *       403:
   *         description: Forbidden
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: You do not have permission to perform this action
   *       404:
   *         description: Not Found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament not found
   *       409:
   *         description: Conflict
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament is not published
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Internal server error
   */
  async startTournament(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      await startTournament.execute(id);
      res.status(200).json(
        ApiResponseBuilder.success(
          null,
          'Tournament started successfully',
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof TournamentNotFoundException ||
        error instanceof BracketNotFoundException
      ) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof TournamentNotPublishedException ||
        error instanceof RegistrationNotClosedException ||
        error instanceof BracketNotInDraftOrPublisedException ||
        error instanceof BracketNotInProgressException
      ) {
        return res.status(409).json(
          ApiResponseBuilder.error(error.message)
        );
      }

      console.error('[ERROR]:', error);
      res.status(500).json(
        ApiResponseBuilder.error('Internal server error')
      );
    }
  }


  /**
   * @swagger
   * /api/tournaments/{id}/info:
   *   put:
   *     summary: Update tournament info
   *     tags: [Tournaments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Tournament ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateTournamentInfoRequest'
   *     responses:
   *       200:
   *         description: Info updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Info updated successfully
   *                 data:
   *                   type: string
   *                   example: null
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: All fields are required
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: No token provided
   *       403:
   *         description: Forbidden
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: You do not have permission to perform this action
   *       404:
   *         description: Not Found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament not found
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Internal server error
   */
  async updateTournamentInfo(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      const { newInfo } = req.body;
      if (!newInfo) {
        throw new MissingRequiredUserFieldsException();
      }

      await updateTournamentInfo.execute({
        id: id,
        newInfo: newInfo,
      });
      res.status(200).json(
        ApiResponseBuilder.success(null, 'Info updated successfully')
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof TournamentNotFoundException) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      console.error('[ERROR]:', error);
      res.status(500).json(
        ApiResponseBuilder.error('Internal server error')
      );
    }
  }


  /**
   * @swagger
   * /api/tournaments/{id}/name:
   *   put:
   *     summary: Update tournament name
   *     tags: [Tournaments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Tournament ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateTournamentNameRequest'
   *     responses:
   *       200:
   *         description: Name updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Name updated successfully
   *                 data:
   *                   type: string
   *                   example: null
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: All fields are required
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: No token provided
   *       403:
   *         description: Forbidden
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: You do not have permission to perform this action
   *       404:
   *         description: Not Found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament not found
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Internal server error
   */
  async updateTournamentName(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      const { newName } = req.body;
      if (!newName) {
        throw new MissingRequiredUserFieldsException();
      }

      await updateTournamentName.execute({
        id: id,
        newName: newName,
      });
      res.status(200).json(
        ApiResponseBuilder.success(null, 'Name updated successfully')
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof TournamentNotFoundException) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      console.error('[ERROR]:', error);
      res.status(500).json(
        ApiResponseBuilder.error('Internal server error')
      );
    }
  }


  /**
   * @swagger
   * /api/tournaments/{id}/registration/open:
   *   post:
   *     summary: Open registration for a tournament
   *     tags: [Tournaments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Tournament ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     responses:
   *       200:
   *         description: Registration opened successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Registration opened successfully
   *                 data:
   *                   type: string
   *                   example: null
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: All fields are required
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: No token provided
   *       403:
   *         description: Forbidden
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: You do not have permission to perform this action
   *       404:
   *         description: Not Found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament not found
   *       409:
   *         description: Conflict
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament is not published
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Internal server error
   */
  async openRegistration(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      await openRegistration.execute(id);
      res.status(200).json(
        ApiResponseBuilder.success(
          null,
          'Registration opened successfully',
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof TournamentNotFoundException) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof TournamentNotPublishedException ||
        error instanceof RegistrationAlreadyOpenException
      ) {
        return res.status(409).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      console.error('[ERROR]:', error);
      res.status(500).json(
        ApiResponseBuilder.error('Internal server error')
      );
    }
  }


  /**
   * @swagger
   * /api/tournaments/{id}/registration/close:
   *   post:
   *     summary: Close registration for a tournament
   *     tags: [Tournaments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Tournament ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     responses:
   *       200:
   *         description: Registration closed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Registration closed successfully
   *                 data:
   *                   type: string
   *                   example: null
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: All fields are required
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: No token provided
   *       403:
   *         description: Forbidden
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: You do not have permission to perform this action
   *       404:
   *         description: Not Found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament not found
   *       409:
   *         description: Conflict
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament is not published
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Internal server error
   */
  async closeRegistration(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      await closeRegistration.execute(id);
      res.status(200).json(
        ApiResponseBuilder.success(
          null,
          'Registration closed successfully',
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof TournamentNotFoundException) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof TournamentNotPublishedException ||
        error instanceof RegistrationAlreadyClosedException
      ) {
        return res.status(409).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      console.error('[ERROR]:', error);
      res.status(500).json(
        ApiResponseBuilder.error('Internal server error')
      );
    }
  }


  /**
   * @swagger
   * /api/tournaments/{id}/registration/schedule:
   *   put:
   *     summary: Update tournament registration period
   *     tags: [Tournaments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Tournament ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateTournamentRegistrationPeriodRequest'
   *     responses:
   *       200:
   *         description: Registration period updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Registration period updated successfully
   *                 data:
   *                   type: string
   *                   example: null
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: All fields are required
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: No token provided
   *       403:
   *         description: Forbidden
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: You do not have permission to perform this action
   *       404:
   *         description: Not Found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament not found
   *       409:
   *         description: Conflict
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament is not published
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Internal server error
   */
  async updateTournamentRegistrationPeriod(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      const { newRegistrationPeriod } = req.body;
      if (!newRegistrationPeriod) {
        throw new MissingRequiredUserFieldsException();
      }

      await updateTournamentRegistrationPeriod.execute({
        id: id,
        newRegistrationPeriod: newRegistrationPeriod,
      });
      res.status(200).json(
        ApiResponseBuilder.success(null, 'Registration period updated successfully')
      );
    } catch (error: any) {
      if (
        error instanceof MissingRequiredUserFieldsException ||
        error instanceof InvalidRegistrationStatusException ||
        error instanceof InvalidRegistrationPeriodException
      ) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof TournamentNotFoundException) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof TournamentNotPublishedException) {
        return res.status(409).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      console.error('[ERROR]:', error);
      res.status(500).json(
        ApiResponseBuilder.error('Internal server error')
      );
    }
  }


  /**
   * @swagger
   * /api/tournaments/{id}/participants:
   *   post:
   *     summary: Register a player in a tournament
   *     tags: [Tournaments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Tournament ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterParticipantInTournamentRequest'
   *     responses:
   *       201:
   *         description: Participant registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Participant registered successfully
   *                 data:
   *                   type: string
   *                   example: null
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: All fields are required
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: No token provided
   *       403:
   *         description: Forbidden
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: You do not have permission to perform this action
   *       404:
   *         description: Not Found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament not found
   *       409:
   *         description: Conflict
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Participant is already registered in this tournament
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Internal server error
   */
  async registerParticipant(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      const { playerId } = req.body;
      if (!playerId) {
        throw new MissingRequiredUserFieldsException();
      }

      await registerParticipantInTournament.execute({
        id: id,
        playerId: playerId,
      });
      res.status(201).json(
        ApiResponseBuilder.success(
          null,
          'Participant registered successfully',
        )
      );
    } catch (error: any) {
      if (
        error instanceof MissingRequiredUserFieldsException ||
        error instanceof InvalidRegisteredPlayerSeasonException
      ) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof TournamentNotFoundException ||
        error instanceof PlayerNotFoundException
      ) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof ParticipantAlreadyRegisteredException ||
        error instanceof RegistrationAlreadyClosedException
      ) {
        return res.status(409).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      console.error('[ERROR]:', error);
      res.status(500).json(
        ApiResponseBuilder.error('Internal server error')
      );
    }
  }


  /**
   * @swagger
   * /api/tournaments/{id}/participants/{participantId}:
   *   delete:
   *     summary: Unregister a player from a tournament
   *     tags: [Tournaments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Tournament ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *       - name: participantId
   *         in: path
   *         required: true
   *         description: Participant ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     responses:
   *       200:
   *         description: Participant unregistered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Participant unregistered successfully
   *                 data:
   *                   type: string
   *                   example: null
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: All fields are required
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: No token provided
   *       403:
   *         description: Forbidden
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: You do not have permission to perform this action
   *       404:
   *         description: Not Found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament not found
   *       409:
   *         description: Conflict
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Participant is not registered in this tournament
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Internal server error
   */
  async unregisterParticipant(req: AuthRequest, res: Response) {
    try {
      const { id, participantId } = req.params;
      if (
        !id || !participantId ||
        typeof id !== 'string' || typeof participantId !== 'string'
      ) {
        throw new MissingRequiredUserFieldsException();
      }

      await unregisterParticipantFromTournament.execute({
        id: id,
        participantId: participantId,
      });
      res.status(200).json(
        ApiResponseBuilder.success(
          null,
          'Participant unregistered successfully',
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof TournamentNotFoundException ||
        error instanceof RegisteredParticipantNotFoundException
      ) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof ParticipantNotRegisteredException) {
        return res.status(409).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      console.error('[ERROR]:', error);
      res.status(500).json(
        ApiResponseBuilder.error('Internal server error')
      );
    }
  }


  /**
   * @swagger
   * /api/tournaments/{id}/participants/{participantId}/checkIn:
   *   post:
   *     summary: Do check in a participant
   *     tags: [Tournaments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Tournament ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *       - name: participantId
   *         in: path
   *         required: true
   *         description: Participant ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     responses:
   *       200:
   *         description: Participant checked in successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Participant checked in successfully
   *                 data:
   *                   type: string
   *                   example: null
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: All fields are required
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: No token provided
   *       403:
   *         description: Forbidden
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: You do not have permission to perform this action
   *       404:
   *         description: Not Found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament not found
   *       409:
   *         description: Conflict
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Participant is not registered in this tournament
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Internal server error
   */
  async doCheckInParticipant(req: AuthRequest, res: Response) {
    try {
      const { id, participantId } = req.params;
      if (
        !id || !participantId ||
        typeof id !== 'string' || typeof participantId !== 'string'
      ) {
        throw new MissingRequiredUserFieldsException();
      }

      await doCheckInParticipant.execute({
        id: id,
        participantId: participantId,
      });
      res.status(200).json(
        ApiResponseBuilder.success(
          null,
          'Participant checked in successfully',
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof TournamentNotFoundException ||
        error instanceof RegisteredParticipantNotFoundException
      ) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof ParticipantNotRegisteredException ||
        error instanceof ParticipantAlreadyCheckedInException
      ) {
        return res.status(409).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      console.error('[ERROR]:', error);
      res.status(500).json(
        ApiResponseBuilder.error('Internal server error')
      );
    }
  }


  /**
   * @swagger
   * /api/tournaments/{id}/participants/{participantId}/checkIn:
   *   delete:
   *     summary: Undo check in a participant
   *     tags: [Tournaments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Tournament ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *       - name: participantId
   *         in: path
   *         required: true
   *         description: Participant ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     responses:
   *       200:
   *         description: Participant undo check in successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Participant undo check in successfully
   *                 data:
   *                   type: string
   *                   example: null
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: All fields are required
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: No token provided
   *       403:
   *         description: Forbidden
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: You do not have permission to perform this action
   *       404:
   *         description: Not Found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament not found
   *       409:
   *         description: Conflict
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Participant is not registered in this tournament
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Internal server error
   */
  async undoCheckInParticipant(req: AuthRequest, res: Response) {
    try {
      const { id, participantId } = req.params;
      if (
        !id || !participantId ||
        typeof id !== 'string' || typeof participantId !== 'string'
      ) {
        throw new MissingRequiredUserFieldsException();
      }

      await undoCheckInParticipant.execute({
        id: id,
        participantId: participantId,
      });
      res.status(200).json(
        ApiResponseBuilder.success(
          null,
          'Participant undo check in successfully',
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof TournamentNotFoundException ||
        error instanceof RegisteredParticipantNotFoundException
      ) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof ParticipantNotRegisteredException ||
        error instanceof ParticipantNotCheckedInException
      ) {
        return res.status(409).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      console.error('[ERROR]:', error);
      res.status(500).json(
        ApiResponseBuilder.error('Internal server error')
      );
    }
  }

  /**
   * @swagger
   * /api/tournaments/{id}/participants:
   *   get:
   *     summary: Get participants by tournament id
   *     tags: [Tournaments]
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Tournament ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     responses:
   *       200:
   *         description: Participants fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Participants fetched successfully
   *                 data:
   *                   $ref: '#/components/schemas/RegisteredParticipant'
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: All fields are required
   *       404:
   *         description: Not Found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament not found
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Internal server error
   */
  async getParticipantsByTournamentId(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      const participants = await getParticipantsByTournamentId.execute(id);
      res.status(200).json(
        ApiResponseBuilder.success(
          participants,
          'Participants fetched successfully',
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof TournamentNotFoundException) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }

      console.error('[ERROR]:', error);
      res.status(500).json(
        ApiResponseBuilder.error('Internal server error')
      );
    }
  }


  /**
   * @swagger
   * /api/tournaments/{id}/matches:
   *   get:
   *     summary: Get matches by tournament id
   *     tags: [Tournaments]
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Tournament ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     responses:
   *       200:
   *         description: Matches fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Matches fetched successfully
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Match'
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: All fields are required
   *       404:
   *         description: Not Found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament not found
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Internal server error
   */
  async getMatchesByTournamentId(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      const matches = await getMatchesByTournamentId.execute(id);
      res.status(200).json(
        ApiResponseBuilder.success(
          matches,
          'Matches fetched successfully',
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof TournamentNotFoundException) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }

      console.error('[ERROR]:', error);
      res.status(500).json(
        ApiResponseBuilder.error('Internal server error')
      );
    }
  }

  // /**
  //  * @swagger
  //  * /api/tournaments/{id}/matches:
  //  *   post:
  //  *     summary: Create a match in a tournament
  //  *     tags: [Tournaments]
  //  *     security:
  //  *       - bearerAuth: []
  //  *     parameters:
  //  *       - name: id
  //  *         in: path
  //  *         required: true
  //  *         description: Tournament ID
  //  *         schema:
  //  *           type: string
  //  *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
  //  *     requestBody:
  //  *       required: true
  //  *       content:
  //  *         application/json:
  //  *           schema:
  //  *             $ref: '#/components/schemas/CreateMatchRequest'
  //  *     responses:
  //  *       201:
  //  *         description: Match created successfully
  //  *         content:
  //  *           application/json:
  //  *             schema:
  //  *               type: object
  //  *               properties:
  //  *                 status:
  //  *                   type: string
  //  *                   example: success
  //  *                 message:
  //  *                   type: string
  //  *                   example: Match created successfully
  //  *                 data:
  //  *                   type: string
  //  *                   example: null
  //  *       400:
  //  *         description: Bad Request
  //  *         content:
  //  *           application/json:
  //  *             schema:
  //  *               type: object
  //  *               properties:
  //  *                 status:
  //  *                   type: string
  //  *                   example: error
  //  *                 message:
  //  *                   type: string
  //  *                   example: All fields are required
  //  *       401:
  //  *         description: Unauthorized
  //  *         content:
  //  *           application/json:
  //  *             schema:
  //  *               type: object
  //  *               properties:
  //  *                 status:
  //  *                   type: string
  //  *                   example: error
  //  *                 message:
  //  *                   type: string
  //  *                   example: No token provided
  //  *       403:
  //  *         description: Forbidden
  //  *         content:
  //  *           application/json:
  //  *             schema:
  //  *               type: object
  //  *               properties:
  //  *                 status:
  //  *                   type: string
  //  *                   example: error
  //  *                 message:
  //  *                   type: string
  //  *                   example: You do not have permission to perform this action
  //  *       404:
  //  *         description: Not Found
  //  *         content:
  //  *           application/json:
  //  *             schema:
  //  *               type: object
  //  *               properties:
  //  *                 status:
  //  *                   type: string
  //  *                   example: error
  //  *                 message:
  //  *                   type: string
  //  *                   example: Tournament not found
  //  *       409:
  //  *         description: Conflict
  //  *         content:
  //  *           application/json:
  //  *             schema:
  //  *               type: object
  //  *               properties:
  //  *                 status:
  //  *                   type: string
  //  *                   example: error
  //  *                 message:
  //  *                   type: string
  //  *                   example: Participant 1 is not registered in this tournament
  //  *       500:
  //  *         description: Internal Server Error
  //  *         content:
  //  *           application/json:
  //  *             schema:
  //  *               type: object
  //  *               properties:
  //  *                 status:
  //  *                   type: string
  //  *                   example: error
  //  *                 message:
  //  *                   type: string
  //  *                   example: Internal server error
  //  */
  // async createMatch(req: AuthRequest, res: Response) {
  //   try {
  //     const id = req.params.id;
  //     if (!id || typeof id !== 'string') {
  //       throw new MissingRequiredUserFieldsException();
  //     }

  //     const { participant1Id, participant2Id, round, boardNumber } = req.body;
  //     if (!participant1Id || !participant2Id || !round) {
  //       throw new MissingRequiredUserFieldsException();
  //     }

  //     await createMatch.execute({
  //       id: id,
  //       participant1Id: participant1Id,
  //       participant2Id: participant2Id,
  //       round: round,
  //       boardNumber: boardNumber,
  //     });
  //     res.status(201).json(
  //       ApiResponseBuilder.success(
  //         null,
  //         'Match created successfully',
  //       )
  //     );
  //   } catch (error: any) {
  //     if (error instanceof MissingRequiredUserFieldsException) {
  //       return res.status(400).json(
  //         ApiResponseBuilder.error(error.message)
  //       );
  //     }
  //     if (error instanceof TournamentNotFoundException) {
  //       return res.status(404).json(
  //         ApiResponseBuilder.error(error.message)
  //       );
  //     }
  //     if (
  //       error instanceof ParticipantNotRegisteredInTournamentException ||
  //       error instanceof MatchAlreadyExistsException
  //     ) {
  //       return res.status(409).json(
  //         ApiResponseBuilder.error(error.message)
  //       );
  //     }
  //     console.error('[ERROR]:', error);
  //     res.status(500).json(
  //       ApiResponseBuilder.error('Internal server error')
  //     );
  //   }
  // }


  /**
   * @swagger
   * /api/tournaments/{id}/bracket:
   *   post:
   *     summary: Create the bracket of a tournament
   *     tags: [Tournaments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Tournament ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     responses:
   *       201:
   *         description: Bracket created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Bracket created successfully
   *                 data:
   *                   $ref: '#/components/schemas/Bracket'
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: All fields are required
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: No token provided
   *       403:
   *         description: Forbidden
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: You do not have permission to perform this action
   *       404:
   *         description: Not Found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament not found
   *       409:
   *         description: Conflict
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Bracket already exists
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Internal server error
   */
  async createBracket(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      const bracket = await createBracket.execute({
        id: id,
      });
      res.status(201).json(
        ApiResponseBuilder.success(
          bracket,
          'Bracket created successfully',
        )
      );
    } catch (error: any) {
      if (
        error instanceof MissingRequiredUserFieldsException
        // error instanceof InvalidRegisteredPlayerSeasonException
      ) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof TournamentNotFoundException
      ) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof BracketAlreadyExistsException ||
        error instanceof RegistratedParticipantsEmptyException ||
        error instanceof RegistratedParticipantsNotEnoughException
      ) {
        return res.status(409).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      console.error('[ERROR]:', error);
      res.status(500).json(
        ApiResponseBuilder.error('Internal server error')
      );
    }
  }


  /**
 * @swagger
 * /api/tournaments/{id}/bracket:
 *   get:
 *     summary: Get tournament bracket
 *     tags: [Tournaments]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Tournament ID
 *         schema:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *     responses:
 *       200:
 *         description: Bracket fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Bracket fetched successfully
 *                 data:
 *                   $ref: '#/components/schemas/Bracket'
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: All fields are required
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Tournament not found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
  async getTournamentBracket(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      const bracket = await getTournamentBracket.execute(id);
      res.status(200).json(
        ApiResponseBuilder.success(
          bracket,
          'Bracket fetched successfully',
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof TournamentNotFoundException ||
        error instanceof BracketNotFoundException
      ) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }

      console.error('[ERROR]:', error);
      res.status(500).json(
        ApiResponseBuilder.error('Internal server error')
      );
    }
  }


  /**
   * @swagger
   * /api/tournaments/{id}/elegiblePlayers:
   *   get:
   *     summary: Get not registered players in tournament
   *     tags: [Tournaments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Tournament ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     responses:
   *       200:
   *         description: Players fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Players fetched successfully
   *                 data:
   *                   $ref: '#/components/schemas/Player'
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: All fields are required
   *       404:
   *         description: Not Found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Tournament not found
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Internal server error
   */
  async getElegiblePlayersByTournamentId(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      let tournament = await getElegiblePlayersByTournamentId.execute(id);

      res.status(200).json(
        ApiResponseBuilder.success(
          tournament,
          'Players fetched successfully',
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof TournamentNotFoundException) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }

      console.error('[ERROR]:', error);
      res.status(500).json(
        ApiResponseBuilder.error('Internal server error')
      );
    }
  }
}
