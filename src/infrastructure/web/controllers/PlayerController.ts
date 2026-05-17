import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { prisma } from '../../persistence/client.js';
import { ApiResponseBuilder } from '../../../application/dtos/common/ApiResponse.js';
import { GetAllPlayers } from '../../../application/services/player/GetAllPlayers.js';
import { PrismaPlayerRepository } from '../../persistence/repositories/PrismaPlayerRepository.js';
import { GetPlayerData } from '../../../application/services/player/GetPlayerData.js';
import { InvalidSeasonException, InvalidYearException, PlayerAlreadyExistsException, PlayerNotFoundException } from '../../../domain/exceptions/PlayerExceptions.js';
import { InvalidUserFieldsException, MissingRequiredUserFieldsException, UserNotFoundException } from '../../../domain/exceptions/UserExceptions.js';
import { CreatePlayer } from '../../../application/services/player/CreatePlayer.js';
import { PrismaUserRepository } from '../../persistence/repositories/PrismaUserRepository.js';
import { UpdatePlayerFederation } from '../../../application/services/player/UpdatePlayerFederation.js';
import { GetPlayerByUserIdAndSeason } from '../../../application/services/player/GetPlayerByUserIdAndSeason.js';

const playerRepository = new PrismaPlayerRepository(prisma);
const userRepository = new PrismaUserRepository(prisma);

const getAllPlayers = new GetAllPlayers(playerRepository);
const getPlayerData = new GetPlayerData(playerRepository);
const getPlayerByUserIdAndSeason = new GetPlayerByUserIdAndSeason(playerRepository);
const createPlayer = new CreatePlayer(playerRepository, userRepository);
const updatePlayerFederation = new UpdatePlayerFederation(playerRepository);

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
   *     summary: Get all players
   *     tags: [Players]
   *     security:
   *       - bearerAuth: []
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
      const players = await getAllPlayers.execute();
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
  async getPlayerData(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new MissingRequiredUserFieldsException();
      }
      if (typeof id !== 'string') {
        throw new InvalidUserFieldsException();
      }

      const player = await getPlayerData.execute(id);
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
   * /api/players/user/{userId}/season/{seasonStartYear}:
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

      const player = await getPlayerByUserIdAndSeason.execute({
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
      const player = await createPlayer.execute(req.body);
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

      await updatePlayerFederation.execute({
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
}
