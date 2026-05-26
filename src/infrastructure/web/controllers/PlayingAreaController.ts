import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { prisma } from '../../persistence/client.js';
import { ApiResponseBuilder } from '../../../application/dtos/common/ApiResponse.js';
import { MissingRequiredUserFieldsException } from '../../../domain/exceptions/UserExceptions.js';
import { BoardAlreadyOccupiedException, BoardDisabledException, BoardNotAvailableException, BoardNotDisabledException, BoardNotFoundException, BoardNotOccupiedException, PlayingAreaAlreadyExistsException, PlayingAreaNotFoundException, MatchAlreadyAssignedToBoardException, PlayingAreaHasNoBoardsException, BoardOccupiedException, BoardPairedWithTabletException } from '../../../domain/exceptions/PlayingAreaExceptions.js';
import { PrismaPlayingAreaRepository } from '../../persistence/repositories/PrismaPlayingAreaRepository.js';
import { DisablePlayingAreaBoard } from '../../../application/services/playingArea/DisablePlayingAreaBoard.js';
// import { OccupyPlayingAreaBoard } from '../../../application/services/playingArea/OccupyPlayingAreaBoard.js';
import { ReleasePlayingAreaBoard } from '../../../application/services/playingArea/ReleasePlayingAreaBoard.js';
import { EnablePlayingAreaBoard } from '../../../application/services/playingArea/EnablePlayingAreaBoard.js';
import { MatchNotFoundException } from '../../../domain/exceptions/MatchExceptions.js';
import { PrismaMatchRepository } from '../../persistence/repositories/PrismaMatchRepository.js';
import { AddBoardInPlayingArea } from '../../../application/services/playingArea/AddBoardInPlayingArea.js';
import { RemoveLastBoardFromPlayingArea } from '../../../application/services/playingArea/RemoveLastBoardFromPlayingArea.js';
import { PrismaUnitOfWork } from '../../persistence/PrismaUnitOfWork.js';


const unitOfWork = new PrismaUnitOfWork(prisma);

const playingAreaRepository = new PrismaPlayingAreaRepository(prisma);
const matchRepository = new PrismaMatchRepository(prisma);

// const occupyPlayingAreaBoard = new OccupyPlayingAreaBoard(unitOfWork, playingAreaRepository, matchRepository);
const releasePlayingAreaBoard = new ReleasePlayingAreaBoard(playingAreaRepository);
const disablePlayingAreaBoard = new DisablePlayingAreaBoard(playingAreaRepository);
const enablePlayingAreaBoard = new EnablePlayingAreaBoard(playingAreaRepository);
const addBoardInPlayingArea = new AddBoardInPlayingArea(playingAreaRepository);
const removeLastBoardFromPlayingArea = new RemoveLastBoardFromPlayingArea(playingAreaRepository);


/**
 * @swagger
 * components:
 *   schemas:
 *     PlayingArea:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *         tournamentId:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *         boards:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               number:
 *                 type: number
 *                 example: 1
 *               status:
 *                 type: string
 *                 example: OCCUPIED
 *               matchId:
 *                 type: string
 *                 example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 * 
 *     OccupyPlayingAreaRequest:
 *       type: object
 *       required:
 *         - matchId
 *       properties:
 *         matchId:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 */
export class PlayingAreaController {


  /**
   * @swagger
   * /api/playing-areas/{id}/boards/{boardNumber}/release:
   *   post:
   *     summary: Occupy a board in a playing area
   *     tags: [PlayingAreas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Playing area ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *       - name: boardNumber
   *         in: path
   *         required: true
   *         description: Board number
   *         schema:
   *           type: number
   *           example: 1
   *     responses:
   *       200:
   *         description: Board released successfully
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
   *                   example: Board released successfully
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
   *                   example: Playing area not found
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
   *                   example: Board is not occupied
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
  async releasePlayingAreaBoard(req: AuthRequest, res: Response) {
    try {
      const { id, boardNumber } = req.params;
      if (!id || !boardNumber || typeof id !== 'string' || typeof boardNumber !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      await releasePlayingAreaBoard.execute({
        id: id,
        boardNumber: Number(boardNumber),
      });
      res.status(200).json(
        ApiResponseBuilder.success(
          null,
          'Board released successfully',
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof PlayingAreaNotFoundException ||
        error instanceof BoardNotFoundException
      ) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof BoardNotOccupiedException) {
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
   * /api/playing-areas/{id}/boards/{boardNumber}/disable:
   *   post:
   *     summary: Disable a board in a playing area
   *     tags: [PlayingAreas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Playing area ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *       - name: boardNumber
   *         in: path
   *         required: true
   *         description: Board number
   *         schema:
   *           type: number
   *           example: 1
   *     responses:
   *       200:
   *         description: Board disabled successfully
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
   *                   example: Board disabled successfully
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
   *                   example: Playing area not found
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
   *                   example: Board is not available
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
  async disablePlayingAreaBoard(req: AuthRequest, res: Response) {
    try {
      const { id, boardNumber } = req.params;
      if (!id || !boardNumber || typeof id !== 'string' || typeof boardNumber !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      await disablePlayingAreaBoard.execute({
        id: id,
        boardNumber: Number(boardNumber),
      });
      res.status(200).json(
        ApiResponseBuilder.success(
          null,
          'Board disabled successfully',
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof PlayingAreaNotFoundException ||
        error instanceof BoardNotFoundException
      ) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof BoardNotAvailableException) {
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
   * /api/playing-areas/{id}/boards/{boardNumber}/enable:
   *   post:
   *     summary: Enable a board in a playing area
   *     tags: [PlayingAreas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Playing area ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *       - name: boardNumber
   *         in: path
   *         required: true
   *         description: Board number
   *         schema:
   *           type: number
   *           example: 1
   *     responses:
   *       200:
   *         description: Board enabled successfully
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
   *                   example: Board enabled successfully
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
   *                   example: Playing area not found
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
   *                   example: Board is not disabled
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
  async enablePlayingAreaBoard(req: AuthRequest, res: Response) {
    try {
      const { id, boardNumber } = req.params;
      if (!id || !boardNumber || typeof id !== 'string' || typeof boardNumber !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      await enablePlayingAreaBoard.execute({
        id: id,
        boardNumber: Number(boardNumber),
      });
      res.status(200).json(
        ApiResponseBuilder.success(
          null,
          'Board enabled successfully',
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof PlayingAreaNotFoundException ||
        error instanceof BoardNotFoundException
      ) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof BoardNotDisabledException) {
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
   * /api/playing-areas/{id}/boards:
   *   post:
   *     summary: Add a new board in a playing area
   *     tags: [PlayingAreas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Playing area ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     responses:
   *       200:
   *         description: Board added successfully
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
   *                   example: Board added successfully
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
   *                   example: Playing area not found
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
  async addBoardInPlayingArea(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      await addBoardInPlayingArea.execute(id);
      res.status(200).json(
        ApiResponseBuilder.success(
          null,
          'Board added successfully',
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof PlayingAreaNotFoundException) {
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
   * /api/playing-areas/{id}/boards/last:
   *   delete:
   *     summary: Remove the last board from a playing area
   *     tags: [PlayingAreas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Playing area ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     responses:
   *       200:
   *         description: Board removed successfully
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
   *                   example: Board removed successfully
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
   *                   example: Playing area not found
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
   *                   example: Playing area has no boards
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
  async removeLastBoardFromPlayingArea(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      await removeLastBoardFromPlayingArea.execute(id);
      res.status(200).json(
        ApiResponseBuilder.success(
          null,
          'Board removed successfully',
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof PlayingAreaNotFoundException) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof PlayingAreaHasNoBoardsException ||
        error instanceof BoardOccupiedException ||
        error instanceof BoardPairedWithTabletException
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
}
