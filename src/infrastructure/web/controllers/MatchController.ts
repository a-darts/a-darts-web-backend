import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { ApiResponseBuilder } from '../../../application/dtos/common/ApiResponse.js';
import { InvalidUserFieldsException, MissingRequiredUserFieldsException } from '../../../domain/exceptions/UserExceptions.js';
import {
  MatchAlreadyFinishedException,
  MatchBoardNumberRequiredException,
  MatchNotFoundException,
  MatchNotInProgressException,
  MatchNotPendingException,
  MatchNotSuspendedException,
} from '../../../domain/exceptions/MatchExceptions.js';
import { BracketNotFoundException } from '../../../domain/exceptions/BracketExceptions.js';
import {
  BoardAlreadyOccupiedException,
  BoardDisabledException,
  BoardNotFoundException,
  BoardNotOccupiedException,
  PlayingAreaNotFoundException,
} from '../../../domain/exceptions/PlayingAreaExceptions.js';
import MatchServiceFactory from '../../factories/MatchServiceFactory.js';
import { TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';


const matchService = MatchServiceFactory.getInstance();


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
 *           example: 1
 *         boardId:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *         boardShortId:
 *           type: string
 *           example: S548-D001
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
 *         tournamentId:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
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
 * 
 *     SetMatchBoardNumberRequest:
 *       type: object
 *       required:
 *         - boardNumber
 *       properties:
 *         boardNumber:
 *           type: number
 *           example: 1
 *
 *     RegisterLegWinRequest:
 *       type: object
 *       required:
 *         - participantId
 *       properties:
 *         participantId:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 * 
 *     RegisterSetWinRequest:
 *       type: object
 *       required:
 *         - participantId
 *       properties:
 *         participantId:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 */
export class MatchController {

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

      const matches = await matchService.getAllByTournamentId(id);
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

      const match = await matchService.getById(id);
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

  /**
   * @swagger
   * /api/matches/{id}/start:
   *   post:
   *     summary: Start match
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
   *         description: Match started successfully
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
   *                   example: Match started successfully
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
   *                   example: Match not found
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
   *                   oneOf:
   *                     - example: Match is not pending
   *                     - example: Match board number is required
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
  async startMatch(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      await matchService.start(id);
      res.status(200).json(
        ApiResponseBuilder.success(
          null,
          'Match started successfully',
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
      if (
        error instanceof MatchNotPendingException ||
        error instanceof MatchBoardNumberRequiredException
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
   * /api/matches/{id}/finish:
   *   post:
   *     summary: Finish match
   *     tags: [Matches]
   *     security:
   *       - bearerAuth: []
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
   *         description: Match finished successfully
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
   *                   example: Match finished successfully
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
   *                   example: Match not found
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
   *                   example: Match is not in progress
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
  async finishMatch(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      await matchService.finish(id);
      res.status(200).json(
        ApiResponseBuilder.success(
          null,
          'Match finished successfully',
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
      if (error instanceof MatchNotInProgressException) {
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
   * /api/matches/{id}/cancel:
   *   post:
   *     summary: Cancel match
   *     tags: [Matches]
   *     security:
   *       - bearerAuth: []
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
   *         description: Match cancelled successfully
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
   *                   example: Match cancelled successfully
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
   *                   example: Match not found
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
   *                   example: Match is already finished
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
  async cancelMatch(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      await matchService.cancel(id);
      res.status(200).json(
        ApiResponseBuilder.success(
          null,
          'Match cancelled successfully',
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
      if (error instanceof MatchAlreadyFinishedException) {
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
   * /api/matches/{id}/suspend:
   *   post:
   *     summary: Suspend match
   *     tags: [Matches]
   *     security:
   *       - bearerAuth: []
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
   *         description: Match suspended successfully
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
   *                   example: Match suspended successfully
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
   *                   example: Match not found
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
   *                   example: Match is not in progress
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
  async suspendMatch(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      await matchService.suspend(id);
      res.status(200).json(
        ApiResponseBuilder.success(
          null,
          'Match suspended successfully',
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
      if (error instanceof MatchNotInProgressException) {
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
   * /api/matches/{id}/resume:
   *   post:
   *     summary: Resume match
   *     tags: [Matches]
   *     security:
   *       - bearerAuth: []
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
   *         description: Match resumed successfully
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
   *                   example: Match resumed successfully
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
   *                   example: Match not found
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
   *                   example: Match is not suspended
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
  async resumeMatch(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      await matchService.resume(id);
      res.status(200).json(
        ApiResponseBuilder.success(
          null,
          'Match resumed successfully',
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
      if (error instanceof MatchNotSuspendedException) {
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
   * /api/matches/{id}/board-number:
   *   put:
   *     summary: Update match board number
   *     tags: [Matches]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Match ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SetMatchBoardNumberRequest'
   *     responses:
   *       200:
   *         description: Board number updated successfully
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
   *                   example: Board number updated successfully
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
   *                   oneOf:
   *                     - example: Match not found
   *                     - example: Playing area not found
   *                     - example: Board not found
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
   *                   oneOf:
   *                     - example: Board is not occupied
   *                     - example: Board is already occupied
   *                     - example: Board is disabled
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
  async setMatchBoardNumber(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      const { boardNumber } = req.body;
      if (!boardNumber) {
        throw new MissingRequiredUserFieldsException();
      }

      await matchService.setBoardNumber({
        id: id,
        boardNumber: boardNumber,
      });
      res.status(200).json(
        ApiResponseBuilder.success(null, 'Board number set successfully')
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof MatchNotFoundException ||
        error instanceof PlayingAreaNotFoundException ||
        error instanceof BoardNotFoundException
      ) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof BoardNotOccupiedException ||
        error instanceof BoardAlreadyOccupiedException ||
        error instanceof BoardDisabledException
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
   * /api/matches/{id}/score:
   *   put:
   *     summary: Update the current match score
   *     tags: [Matches]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Match ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - p1Sets
   *               - p1Legs
   *               - p2Sets
   *               - p2Legs
   *             properties:
   *               p1Sets:
   *                 type: number
   *               p1Legs:
   *                 type: number
   *               p2Sets:
   *                 type: number
   *               p2Legs:
   *                 type: number
   *     responses:
   *       200:
   *         description: Match score updated successfully
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
   *                   oneOf:
   *                     - example: All fields are required
   *                     - example: Invalid user fields
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
   *                   oneOf:
   *                     - example: Match not found
   *                     - example: Bracket not found
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
  async updateMatchScore(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      const { p1Sets, p1Legs, p2Sets, p2Legs } = req.body;

      if (id === undefined || p1Sets === undefined || p1Legs === undefined || p2Sets === undefined || p2Legs === undefined) {
        throw new MissingRequiredUserFieldsException();
      }

      if (
        typeof id !== 'string' ||
        typeof p1Sets !== 'number' ||
        typeof p1Legs !== 'number' ||
        typeof p2Sets !== 'number' ||
        typeof p2Legs !== 'number'
      ) {
        throw new InvalidUserFieldsException();
      }

      await matchService.updateScore({
        id: id,
        participant1Sets: p1Sets,
        participant1Legs: p1Legs,
        participant2Sets: p2Sets,
        participant2Legs: p2Legs,
      });
      res.status(200).json(
        ApiResponseBuilder.success(
          null,
          'Match score updated successfully',
        )
      );
    } catch (error: any) {
      if (
        error instanceof MissingRequiredUserFieldsException ||
        error instanceof InvalidUserFieldsException
      ) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof MatchNotFoundException ||
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
   * /api/matches/{id}/result:
   *   post:
   *     summary: Set final result and finish match
   *     tags: [Matches]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Match ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - p1Sets
   *               - p1Legs
   *               - p2Sets
   *               - p2Legs
   *             properties:
   *               p1Sets:
   *                 type: number
   *               p1Legs:
   *                 type: number
   *               p2Sets:
   *                 type: number
   *               p2Legs:
   *                 type: number
   *     responses:
   *       200:
   *         description: Match result set successfully
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
   *                   oneOf:
   *                     - example: All fields are required
   *                     - example: Invalid user fields
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
   *                   oneOf:
   *                     - example: Match not found
   *                     - example: Bracket not found
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
   *                   oneOf:
   *                     - example: Match is not in progress
   *                     - example: Match is not pending
   *                     - example: Match is already in progress
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
  async setMatchResult(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      const { p1Sets, p1Legs, p2Sets, p2Legs } = req.body;

      if (id === undefined || p1Sets === undefined || p1Legs === undefined || p2Sets === undefined || p2Legs === undefined) {
        throw new MissingRequiredUserFieldsException();
      }

      if (
        typeof id !== 'string' ||
        typeof p1Sets !== 'number' ||
        typeof p1Legs !== 'number' ||
        typeof p2Sets !== 'number' ||
        typeof p2Legs !== 'number'
      ) {
        throw new InvalidUserFieldsException();
      }

      await matchService.setResultAndPromote({
        id: id,
        participant1Sets: p1Sets,
        participant1Legs: p1Legs,
        participant2Sets: p2Sets,
        participant2Legs: p2Legs,
      });
      res.status(200).json(
        ApiResponseBuilder.success(
          null,
          'Match result set successfully',
        )
      );
    } catch (error: any) {
      if (
        error instanceof MissingRequiredUserFieldsException ||
        error instanceof InvalidUserFieldsException
      ) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof MatchNotFoundException ||
        error instanceof BracketNotFoundException
      ) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof MatchNotInProgressException ||
        error instanceof MatchNotPendingException ||
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
}
