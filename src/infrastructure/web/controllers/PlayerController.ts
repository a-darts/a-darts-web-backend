import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { prisma } from '../../persistence/client.js';
import { ApiResponseBuilder } from '../../../application/dtos/common/ApiResponse.js';
import { GetAllPlayers } from '../../../application/services/player/GetAllPlayers.js';
import { PrismaPlayerRepository } from '../../persistence/repositories/PrismaPlayerRepository.js';
import { GetPlayerData } from '../../../application/services/player/GetPlayerData.js';
import { PlayerNotFoundException } from '../../../domain/exceptions/PlayerExceptions.js';
import { MissingRequiredUserFieldsException } from '../../../domain/exceptions/UserExceptions.js';

const playerRepository = new PrismaPlayerRepository(prisma);

const getAllPlayers = new GetAllPlayers(playerRepository);
const getPlayerData = new GetPlayerData(playerRepository);


/**
 * @swagger
 * components:
 *   schemas:
 *     Player:
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
 *         seasonStartYear:
 *           type: number
 *           example: 2026
 *         seasonEndYear:
 *           type: number
 *           example: 2027
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
      if (!req.user) {
        return res.status(401).json(
          ApiResponseBuilder.error('User not authenticated')
        );
      }

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
 *     summary: Get player data by user ID
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID associated with the player
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
      const { userId } = req.params;
      if (!userId) {
        throw new MissingRequiredUserFieldsException();
      }

      if (!req.user) {
        return res.status(401).json(
          ApiResponseBuilder.error('User not authenticated')
        );
      }
      const playerDto = await getPlayerData.execute(userId);
      res.status(200).json(
        ApiResponseBuilder.success(
          playerDto,
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
}
