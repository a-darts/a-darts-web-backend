import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { prisma } from '../../persistence/client.js';
import { ApiResponseBuilder } from '../../../application/dtos/common/ApiResponse.js';
import { GetAllTournaments } from '../../../application/services/tournament/GetAllTournaments.js';
import { PrismaTournamentRepository } from '../../persistence/repositories/PrismaTournamentRepository.js';
import { TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';
import { InvalidUserFieldsException, MissingRequiredUserFieldsException } from '../../../domain/exceptions/UserExceptions.js';
import { CreateTournament } from '../../../application/services/tournament/CreateTournament.js';

const tournamentRepository = new PrismaTournamentRepository(prisma);

const getAllTournaments = new GetAllTournaments(tournamentRepository);
const createTournament = new CreateTournament(tournamentRepository);

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
 *     CreateTournamentRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Campeonato de España Individual Femenino
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
}
