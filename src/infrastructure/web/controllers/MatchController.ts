import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { prisma } from '../../persistence/client.js';
import { ApiResponseBuilder } from '../../../application/dtos/common/ApiResponse.js';
import { GetAllTournaments } from '../../../application/services/tournament/GetAllTournaments.js';
import { PrismaTournamentRepository } from '../../persistence/repositories/PrismaTournamentRepository.js';
import { InvalidTournamentStatusUpdateException, TournamentNotFoundException, TournamentNotInDraftException, TournamentNotInProgressException, TournamentNotPublishedException } from '../../../domain/exceptions/TournamentExceptions.js';
import { MissingRequiredUserFieldsException, UserNotFoundException } from '../../../domain/exceptions/UserExceptions.js';
import { CreateTournament } from '../../../application/services/tournament/CreateTournament.js';
import { UpdateTournamentStatus } from '../../../application/services/tournament/UpdateTournamentStatus.js';
import { InvalidRegistrationPeriodException, InvalidRegistrationStatusException, RegistrationAlreadyClosedException, RegistrationAlreadyOpenException, RegistrationNotClosedException } from '../../../domain/exceptions/RegistrationExceptions.js';
import { UpdateTournamentInfo } from '../../../application/services/tournament/UpdateTournamentInfo.js';
import { UpdateTournamentName } from '../../../application/services/tournament/UpdateTournamentName.js';
import { UpdateTournamentRegistrationStatus } from '../../../application/services/tournament/registration/UpdateTournamentRegistrationStatus.js';
import { UpdateTournamentRegistrationPeriod } from '../../../application/services/tournament/registration/UpdateTournamentRegistrationPeriod.js';
import { RegisterParticipantInTournament } from '../../../application/services/tournament/registration/RegisterParticipantInTournament.js';
import { PrismaRegisteredParticipantRepository } from '../../persistence/repositories/PrismaRegisteredParticipantRepository.js';
import { PrismaPlayerRepository } from '../../persistence/repositories/PrismaPlayerRepository.js';
import { InvalidRegisteredPlayerSeasonException, PlayerNotFoundException } from '../../../domain/exceptions/PlayerExceptions.js';
import { ParticipantAlreadyCheckedInException, ParticipantAlreadyRegisteredException, ParticipantNotCheckedInException, ParticipantNotRegisteredException, RegisteredParticipantNotFoundException } from '../../../domain/exceptions/ParticipantExceptions.js';
import { MatchAlreadyExistsException, MatchNotFoundException, ParticipantNotRegisteredInTournamentException } from '../../../domain/exceptions/MatchExceptions.js';
import { UnregisterParticipantFromTournament } from '../../../application/services/tournament/registration/UnregisterParticipantFromTournament.js';
import { DoCheckInParticipant } from '../../../application/services/tournament/registration/DoCheckInParticipant.js';
import { UndoCheckInParticipant } from '../../../application/services/tournament/registration/UndoCheckInParticipant.js';
import { GetTournamentById } from '../../../application/services/tournament/GetTournamentById.js';
import { GetParticipantsByTournamentId } from '../../../application/services/tournament/registration/GetParticipantsByTournamentId.js';
import { PrismaUserRepository } from '../../persistence/repositories/PrismaUserRepository.js';
import { GetMatchesByTournamentId } from '../../../application/services/tournament/matches/GetMatchesByTournamentId.js';
import { PrismaMatchRepository } from '../../persistence/repositories/PrismaMatchRepository.js';
import { CreateMatch } from '../../../application/services/tournament/matches/CreateMatch.js';
import { GetMatchById } from '../../../application/services/tournament/matches/GetMatchById.js';


const matchRepository = new PrismaMatchRepository(prisma);

const getMatchById = new GetMatchById(matchRepository);

/**
 * @swagger
 * components:
 *   schemas:
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
 *         participant1Id:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *         participant2Id:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
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
 */
export class MatchController {

  /**
   * @swagger
   * /api/matches/{id}:
   *   get:
   *     summary: Get match by id
   *     tags: [Matches]
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Match ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     responses:
   *       200:
   *         description: Match fetched successfully
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
   *                   example: Match fetched successfully
   *                 data:
   *                   $ref: '#/components/schemas/Match'
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
   *                   example: Match not found
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
  async getMatchById(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      const match = await getMatchById.execute(id);
      res.status(200).json(
        ApiResponseBuilder.success(
          match,
          'Match fetched successfully',
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof MatchNotFoundException) {
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
