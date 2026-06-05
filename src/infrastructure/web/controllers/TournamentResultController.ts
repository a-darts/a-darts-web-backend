import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { ApiResponseBuilder } from '../../../application/dtos/common/ApiResponse.js';
import {
  TournamentNotFoundException,
} from '../../../domain/exceptions/TournamentExceptions.js';
import { MissingRequiredUserFieldsException, UserNotFoundException } from '../../../domain/exceptions/UserExceptions.js';
import { TournamentResultNotFoundException } from '../../../domain/exceptions/TournamentResultException.js';
import TournamentResultsServiceFactory from '../../factories/TournamentResultsServiceFactory.js';


const tournamentResultsService = TournamentResultsServiceFactory.getInstance();


/**
 * @swagger
 * components:
 *   schemas:
 *     TournamentResult:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *         tournamentId:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *         participantsResults:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               participantId:
 *                 type: string
 *                 example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *               playerId:
 *                 type: string
 *                 example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *               alias:
 *                 type: string
 *                 example: Pepe
 *               federation:
 *                 type: string
 *                 example: ARAGON
 *               finalPosition:
 *                 type: number
 *                 example: 1
 *               matchesWon:
 *                 type: number
 *                 example: 2
 *               matchesLost:
 *                 type: number
 *                 example: 0
 *               setsWon:
 *                 type: number
 *                 example: 2
 *               setsLost:
 *                 type: number
 *                 example: 0
 *               legsWon:
 *                 type: number
 *                 example: 6
 *               legsLost:
 *                 type: number
 *                 example: 0
 */
export class TournamentResultController {


  /**
   * @swagger
   * /api/tournaments/{id}/results:
   *   get:
   *     summary: Get tournament results
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
   *         description: Tournament results fetched successfully
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
   *                   example: Tournament results fetched successfully
   *                 data:
   *                   $ref: '#/components/schemas/TournamentResult'
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
   *                   oneOf:
   *                     - example: Tournament not found
   *                     - example: Tournament result not found
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
  async getTournamentResults(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      const results = await tournamentResultsService.getByTournamentId(id);

      res.status(200).json(
        ApiResponseBuilder.success(
          results,
          'Tournament results fetched successfully',
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
        error instanceof TournamentResultNotFoundException
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
}
