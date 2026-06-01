import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { prisma } from '../../persistence/prismaClient.js';
import { ApiResponseBuilder } from '../../../application/dtos/common/ApiResponse.js';
import { PrismaPlayerRepository } from '../../persistence/repositories/PrismaPlayerRepository.js';
import { InvalidSeasonException, InvalidYearException, PlayerAlreadyExistsException, PlayerNotFoundException } from '../../../domain/exceptions/PlayerExceptions.js';
import { InvalidUserFieldsException, MissingRequiredUserFieldsException, UserNotFoundException } from '../../../domain/exceptions/UserExceptions.js';
import { PrismaUserRepository } from '../../persistence/repositories/PrismaUserRepository.js';
import PlayerServiceFactory from '../../factories/PlayerServiceFactory.js';
import { TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';


const playerService = PlayerServiceFactory.getInstance();


/**
 * @swagger
 * components:
 *   schemas:
 *     Player:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *         userId:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *         registrationNumber:
 *           type: string
 *           example: 5441068146
 *         federation:
 *           type: string
 *           example: ARAGON
 *         seasonStartYear:
 *           type: number
 *           example: 2026
 * 
 *     PlayerWithUser:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *         userId:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *         registrationNumber:
 *           type: string
 *           example: 5441068146
 *         federation:
 *           type: string
 *           example: ARAGON
 *         seasonStartYear:
 *           type: number
 *           example: 2026
 *         userAlias:
 *           type: string
 *           example: Pepe
 * 
 *     CreatePlayerRequest:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *         registrationNumber:
 *           type: string
 *           example: 5441068146
 *         federation:
 *           type: string
 *           example: ARAGON
 *         season:
 *           type: object
 *           properties:
 *             startYear:
 *               type: number
 *               example: 2026
 *     UpdateFederationRequest:
 *       type: object
 *       required:
 *         - newFederation
 *       properties:
 *         newFederation:
 *           type: string
 *           example: ARAGON
 */
export class PlayerController {

  /**
   * @swagger
   * /api/players:
   *   get:
   *     summary: Get all players (supports optional pagination)
   *     tags: [Players]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: Page number (1-based)
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: Maximum number of players to return
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
   *                   oneOf:
   *                     - type: array
   *                       items:
   *                         $ref: '#/components/schemas/PlayerWithUser'
   *                     - type: object
   *                       properties:
   *                         players:
   *                           type: array
   *                           items:
   *                             $ref: '#/components/schemas/PlayerWithUser'
   *                         pagination:
   *                           type: object
   *                           properties:
   *                             total:
   *                               type: integer
   *                             page:
   *                               type: integer
   *                             limit:
   *                               type: integer
   *                             totalPages:
   *                               type: integer
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
  async getAllPlayers(req: AuthRequest, res: Response) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      if (page !== undefined && (isNaN(page) || page <= 0)) {
        return res.status(400).json(ApiResponseBuilder.error('Invalid page number'));
      }
      if (limit !== undefined && (isNaN(limit) || limit <= 0)) {
        return res.status(400).json(ApiResponseBuilder.error('Invalid limit number'));
      }

      const players = await playerService.getAll(page, limit);
      res.status(200).json(
        ApiResponseBuilder.success(players, 'Players fetched successfully')
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
   * /api/players/{id}:
   *   get:
   *     summary: Get player data
   *     tags: [Players]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Player ID
   *     responses:
   *       200:
   *         description: Player data retrieved successfully
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
   *                   example: Player data retrieved successfully
   *                 data:
   *                   $ref: '#/components/schemas/PlayerWithUser'
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
   *                   example: Player not found
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
  async getPlayerById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new MissingRequiredUserFieldsException();
      }
      if (typeof id !== 'string') {
        throw new InvalidUserFieldsException();
      }

      const player = await playerService.getById(id);
      res.status(200).json(
        ApiResponseBuilder.success(
          player,
          'Player data retrieved successfully',
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof PlayerNotFoundException) {
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
   * /api/players/users/{userId}/seasons/{seasonStartYear}:
   *   get:
   *     summary: Get player data by user ID and season
   *     tags: [Players]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *       - in: path
   *         name: seasonStartYear
   *         required: true
   *         schema:
   *           type: integer
   *         description: Season start year
   *     responses:
   *       200:
   *         description: Player data retrieved successfully
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
   *                   example: Player data retrieved successfully
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
   *                   example: Player not found
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
  async getPlayerByUserIdAndSeason(req: AuthRequest, res: Response) {
    try {
      const { userId, seasonStartYear } = req.params;
      if (!userId || !seasonStartYear) {
        throw new MissingRequiredUserFieldsException();
      }
      if (typeof userId !== 'string' || typeof seasonStartYear !== 'string') {
        throw new InvalidUserFieldsException();
      }

      const player = await playerService.getByUserIdAndSeason({
        userId: userId,
        seasonStartYear: parseInt(seasonStartYear, 10),
      });
      res.status(200).json(
        ApiResponseBuilder.success(
          player,
          'Player data retrieved successfully',
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof PlayerNotFoundException) {
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
   * /api/players:
   *   post:
   *     summary: Create a new player
   *     tags: [Players]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreatePlayerRequest'
   *     responses:
   *       201:
   *         description: Player created successfully
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
   *                   example: Player created successfully
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
   *                   oneOf:
   *                      - example: All fields are required
   *                      - example: Invalid year. It must be between 1900 and 2200
   *                      - example: Invalid season. It must span exactly one year
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
   *                   example: User not found
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
   *                   example: Player already exists
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
  async createPlayer(req: AuthRequest, res: Response) {
    try {
      const player = await playerService.create(req.body);
      res.status(201).json(
        ApiResponseBuilder.success(player, 'Player created successfully')
      );
    } catch (error: any) {
      if (
        error instanceof MissingRequiredUserFieldsException ||
        error instanceof InvalidYearException ||
        error instanceof InvalidSeasonException
      ) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof UserNotFoundException) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof PlayerAlreadyExistsException) {
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
   * /api/players/{id}/federation:
   *   put:
   *     summary: Update player federation
   *     tags: [Players]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Player ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateFederationRequest'
   *     responses:
   *       200:
   *         description: Federation updated successfully
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
   *                   example: Federation updated successfully
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
   *                   example: Player not found
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
  async updatePlayerFederation(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      const { newFederation } = req.body;
      if (!newFederation) {
        throw new MissingRequiredUserFieldsException();
      }

      await playerService.updateFederation({
        id: id,
        newFederation: newFederation,
      });
      res.status(200).json(
        ApiResponseBuilder.success(null, 'Federation updated successfully')
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof PlayerNotFoundException) {
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
   * /api/tournaments/{id}/unregistered-players:
   *   get:
   *     summary: Get unregistered players in tournament
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
   *         description: Unregistered players fetched successfully
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
   *                   example: Unregistered players fetched successfully
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/UnregisteredPlayer'
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
  async getUnregisteredPlayersByTournamentId(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      let tournament = await playerService.getUnregisteredPlayersInTournament(id);

      res.status(200).json(
        ApiResponseBuilder.success(
          tournament,
          'Unregistered players fetched successfully',
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
