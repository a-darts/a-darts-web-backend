import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { ApiResponseBuilder } from '../../../application/dtos/common/ApiResponse.js';
import {
  TournamentAlreadyHasBracketException,
  TournamentMaxPlayersExceededException,
  TournamentNotFoundException,
} from '../../../domain/exceptions/TournamentExceptions.js';
import { MissingRequiredUserFieldsException } from '../../../domain/exceptions/UserExceptions.js';
import { RegistrationAlreadyClosedException } from '../../../domain/exceptions/RegistrationExceptions.js';
import { InvalidRegisteredPlayerSeasonException, PlayerNotFoundException } from '../../../domain/exceptions/PlayerExceptions.js';
import {
  ParticipantAlreadyCheckedInException,
  ParticipantAlreadyRegisteredException,
  ParticipantNotCheckedInException,
  ParticipantNotRegisteredException,
  RegisteredParticipantNotFoundException,
} from '../../../domain/exceptions/ParticipantExceptions.js';
import RegisteredParticipantServiceFactory from '../../factories/RegisteredParticipantServiceFactory.js';


const registeredParticipantService = RegisteredParticipantServiceFactory.getInstance();


/**
 * @swagger
 * components:
 *   schemas:
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
 *     RegisterParticipantInTournamentRequest:
 *       type: object
 *       required:
 *         - playerId
 *       properties:
 *         playerId:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 */
export class RegisteredParticipantController {

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

      await registeredParticipantService.registerParticipantInTournament({
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
        error instanceof RegistrationAlreadyClosedException ||
        error instanceof TournamentMaxPlayersExceededException ||
        error instanceof TournamentAlreadyHasBracketException
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

      await registeredParticipantService.unregisterParticipantFromTournament({
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
      if (
        error instanceof ParticipantNotRegisteredException ||
        error instanceof TournamentAlreadyHasBracketException
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

      await registeredParticipantService.doCheckInParticipant({
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

      await registeredParticipantService.undoCheckInParticipant({
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

      const participants = await registeredParticipantService.getRegisteredParticipantsByTournamentId(id);
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
}
