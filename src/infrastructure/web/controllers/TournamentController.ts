import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { prisma } from '../../persistence/client.js';
import { ApiResponseBuilder } from '../../../application/dtos/common/ApiResponse.js';
import { GetAllTournaments } from '../../../application/services/tournament/GetAllTournaments.js';
import { PrismaTournamentRepository } from '../../persistence/repositories/PrismaTournamentRepository.js';
import { TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';
import { InvalidUserFieldsException, MissingRequiredUserFieldsException } from '../../../domain/exceptions/UserExceptions.js';

const tournamentRepository = new PrismaTournamentRepository(prisma);

const getAllTournaments = new GetAllTournaments(tournamentRepository);


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
 *           type: object
 *           properties:
 *             place:
 *               type: string
 *               example: Hotel Verona, Puertollano
 *             dateTime:
 *               type: string
 *               format: date-time
 *               example: 2026-05-02T11:00:00.000Z
 *             mode:
 *               type: string
 *               example: WOMEN_SINGLES
 *             game:
 *               type: string
 *               example: 501
 *             schedule:
 *               type: string
 *               example: KO
 *             maxPlayers:
 *               type: number
 *               example: 300
 *             gameType:
 *               type: string
 *               example: BEST_OF
 *             numLegs:
 *               type: number
 *               example: 5
 *             numSets:
 *               type: number
 *               example: 1
 *             rules:
 *               type: string
 *               example: La salida será por aproximación
 *             info:
 *               type: string
 *               example: For more information, visit https://example.com
 *             federation:
 *               type: string
 *               example: ESPAÑA
 *         registration:
 *           type: object
 *           properties:
 *             hasCheckIn:
 *               type: boolean
 *               example: true
 *             registrationPeriod:
 *               type: object
 *               properties:
 *                 startsAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2026-05-02T11:00:00.000Z
 *                 endsAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2026-05-02T11:00:00.000Z
 *             registeredParticipantsIds:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["1", "2", "3"]
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
      if (!req.user) {
        return res.status(401).json(
          ApiResponseBuilder.error('User not authenticated')
        );
      }

      const tournaments = await getAllTournaments.execute();
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
}
