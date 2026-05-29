import { Response } from 'express';
import { ApiResponseBuilder } from "../../../application/dtos/common/ApiResponse.js";
import {
    BracketAlreadyFinishedException,
    BracketInProgressException,
    BracketNotFoundException,
    BracketNotInDraftException,
    BracketNotInDraftOrPublisedException,
    BracketNotPublishedException,
    DuplicateParticipantsException,
    InvalidPositionsException,
} from "../../../domain/exceptions/BracketExceptions.js";
import { MissingRequiredUserFieldsException } from "../../../domain/exceptions/UserExceptions.js";
import { AuthRequest } from "../middlewares/authMiddleware.js";
import { RegisteredParticipantNotFoundException, RegistratedParticipantsEmptyException, RegistratedParticipantsNotEnoughException } from '../../../domain/exceptions/ParticipantExceptions.js';
import BracketServiceFactory from '../../factories/BracketServiceFactory.js';
import { TournamentAlreadyHasBracketException, TournamentNotFoundException, TournamentNotPublishedException } from '../../../domain/exceptions/TournamentExceptions.js';
import { RegistrationNotClosedException } from '../../../domain/exceptions/RegistrationExceptions.js';
import { UserRoles } from '../../../domain/entities/User.js';
import { BracketStatus } from '../../../domain/entities/Bracket.js';

const bracketService = BracketServiceFactory.getInstance();


/**
 * @swagger
 * components:
 *   schemas:
 *     Bracket:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *         tournamentId:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *         status:
 *           type: string
 *           example: DRAFT
 *         totalPositions:
 *           type: number
 *           example: 1
 *         positions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               position:
 *                 type: number
 *                 example: 1
 *               participantId:
 *                 type: string
 *                 example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *               participantAlias:
 *                 type: string
 *                 example: Pepe
 *               participantFederation:
 *                 type: string
 *                 example: ARAGON
 * 
 *     UpdateBracketPositionsRequest:
 *       type: object
 *       required:
 *         - position1
 *         - position2
 *       properties:
 *         position1:
 *           type: number
 *           example: 1
 *         position2:
 *           type: number
 *           example: 4
 * 
 *     SetupPositionsRequest:
 *       type: object
 *       required:
 *         - newPositions
 *       properties:
 *         newPositions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               participantId:
 *                 type: string
 *                 example: "d3b07384-d113-49cd-a5d6-8ee412e4df32"
 *               position:
 *                 type: integer
 *                 example: 1
 */
export class BracketController {
    
    /**
     * @swagger
     * /api/tournaments/{id}/bracket/automatic:
     *   post:
     *     summary: Create the bracket of a tournament automatically
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
     *       201:
     *         description: Bracket automatically created successfully
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
     *                   example: Bracket automatically created successfully
     *                 data:
     *                   $ref: '#/components/schemas/Bracket'
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
     *                   example: Tournament already has a bracket
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
    async createBracketAutomatically(req: AuthRequest, res: Response) {
        try {
            const id = req.params.id;
            if (!id || typeof id !== 'string') {
                throw new MissingRequiredUserFieldsException();
            }

            const bracket = await bracketService.createAutomatically({
                id: id,
            });
            res.status(201).json(
                ApiResponseBuilder.success(
                    bracket,
                    'Bracket automatically created successfully',
                )
            );
        } catch (error: any) {
            if (error instanceof MissingRequiredUserFieldsException) {
                return res.status(400).json(
                    ApiResponseBuilder.error(error.message)
                );
            }
            if (
                error instanceof TournamentNotFoundException
            ) {
                return res.status(404).json(
                    ApiResponseBuilder.error(error.message)
                );
            }
            if (
                error instanceof RegistratedParticipantsEmptyException ||
                error instanceof RegistratedParticipantsNotEnoughException ||
                error instanceof TournamentAlreadyHasBracketException ||
                error instanceof TournamentNotPublishedException ||
                error instanceof RegistrationNotClosedException
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
     * /api/tournaments/{id}/bracket/manual:
     *   post:
     *     summary: Create the bracket of a tournament manually
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
     *       201:
     *         description: Bracket manually created successfully
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
     *                   example: Bracket manually created successfully
     *                 data:
     *                   $ref: '#/components/schemas/Bracket'
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
     *                   example: Tournament already has a bracket
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
    async createBracketManually(req: AuthRequest, res: Response) {
        try {
            const id = req.params.id;
            if (!id || typeof id !== 'string') {
                throw new MissingRequiredUserFieldsException();
            }

            const bracket = await bracketService.createManually({
                id: id,
            });
            res.status(201).json(
                ApiResponseBuilder.success(
                    bracket,
                    'Bracket manually created successfully',
                )
            );
        } catch (error: any) {
            if (error instanceof MissingRequiredUserFieldsException) {
                return res.status(400).json(
                    ApiResponseBuilder.error(error.message)
                );
            }
            if (
                error instanceof TournamentNotFoundException
            ) {
                return res.status(404).json(
                    ApiResponseBuilder.error(error.message)
                );
            }
            if (
                error instanceof RegistratedParticipantsEmptyException ||
                error instanceof RegistratedParticipantsNotEnoughException ||
                error instanceof TournamentAlreadyHasBracketException ||
                error instanceof TournamentNotPublishedException ||
                error instanceof RegistrationNotClosedException
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
     * /api/tournaments/{id}/bracket:
     *   get:
     *     summary: Get tournament bracket
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
     *         description: Bracket fetched successfully
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
     *                   example: Bracket fetched successfully
     *                 data:
     *                   $ref: '#/components/schemas/Bracket'
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
    async getTournamentBracket(req: AuthRequest, res: Response) {
        try {
            const id = req.params.id;
            if (!id || typeof id !== 'string') {
                throw new MissingRequiredUserFieldsException();
            }

            const bracket = await bracketService.getByTournamentId(id);

            // Filter DRAFT brackets if not ADMIN
            const isAdmin = req.user?.role === UserRoles.ADMIN;
            if (!isAdmin) {
                if (bracket.status === BracketStatus.DRAFT) {
                    throw new BracketNotFoundException();
                }
            }

            res.status(200).json(
                ApiResponseBuilder.success(
                    bracket,
                    'Bracket fetched successfully',
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
     * /api/brackets/{id}/setup-positions:
     *   put:
     *     summary: Assign participants to positions in the bracket
     *     tags: [Brackets]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: Bracket ID
     *         schema:
     *           type: string
     *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/SetupPositionsRequest'
     *     responses:
     *       200:
     *         description: Participants assigned to positions successfully
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
     *                   example: Participants assigned to positions successfully
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
     *                   example: Bracket not found
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
     *                   example: Bracket not in draft or published
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
    async setupPositions(req: AuthRequest, res: Response) {
        try {
            const id = req.params.id;
            if (!id || typeof id !== 'string') {
                throw new MissingRequiredUserFieldsException();
            }

            const { newPositions } = req.body;
            if (!Array.isArray(newPositions) || newPositions.length === 0) {
                throw new MissingRequiredUserFieldsException();
            }
            for (const item of newPositions) {
                if (
                    typeof item.position !== 'number' ||
                    (item.participantId !== null && typeof item.participantId !== 'string')
                ) {
                    throw new InvalidPositionsException();
                }
            }

            await bracketService.assignParticipantToBracketPosition({
                id: id,
                newPositions: newPositions.map(item => ({
                    position: item.position,
                    participantId: item.participantId
                }))
            });
            res.status(200).json(
                ApiResponseBuilder.success(
                    null,
                    'Participants assigned to positions successfully',
                )
            );
        } catch (error: any) {
            if (
                error instanceof MissingRequiredUserFieldsException ||
                error instanceof InvalidPositionsException
            ) {
                return res.status(400).json(
                    ApiResponseBuilder.error(error.message)
                );
            }
            if (
                error instanceof BracketNotFoundException ||
                error instanceof RegisteredParticipantNotFoundException
            ) {
                return res.status(404).json(
                    ApiResponseBuilder.error(error.message)
                );
            }
            if (
                error instanceof BracketNotInDraftOrPublisedException ||
                error instanceof DuplicateParticipantsException
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
     * /api/brackets/{id}/reshuffle:
     *   post:
     *     summary: Reshuffle positions in the bracket
     *     tags: [Brackets]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: Bracket ID
     *         schema:
     *           type: string
     *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
     *  
     *     responses:
     *       200:
     *         description: Bracket reshuffled successfully
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
     *                   example: Bracket reshuffled successfully
     *                 data:
     *                   $ref: '#/components/schemas/Bracket'
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
     *                   example: Bracket not found
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
     *                   example: Bracket not in draft or published
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
    async reshuffleBracket(req: AuthRequest, res: Response) {
        try {
            const id = req.params.id;
            if (!id || typeof id !== 'string') {
                throw new MissingRequiredUserFieldsException();
            }

            const bracket = await bracketService.reshuffle({
                id: id,
            });
            res.status(200).json(
                ApiResponseBuilder.success(
                    bracket,
                    'Bracket reshuffled successfully',
                )
            );
        } catch (error: any) {
            if (error instanceof MissingRequiredUserFieldsException) {
                return res.status(400).json(
                    ApiResponseBuilder.error(error.message)
                );
            }
            if (error instanceof BracketNotFoundException) {
                return res.status(404).json(
                    ApiResponseBuilder.error(error.message)
                );
            }
            if (error instanceof BracketNotInDraftOrPublisedException) {
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
     * /api/brackets/{id}/publish:
     *   post:
     *     summary: Publish bracket
     *     tags: [Brackets]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: Bracket ID
     *         schema:
     *           type: string
     *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
     *     responses:
     *       200:
     *         description: Bracket published successfully
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
     *                   example: Bracket published successfully
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
     *                   example: Bracket not found
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
     *                   example: Bracket not in draft
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
    async publishBracket(req: AuthRequest, res: Response) {
        try {
            const id = req.params.id;
            if (!id || typeof id !== 'string') {
                throw new MissingRequiredUserFieldsException();
            }

            await bracketService.publish(id);
            res.status(200).json(
                ApiResponseBuilder.success(
                    null,
                    'Bracket published successfully',
                )
            );
        } catch (error: any) {
            if (error instanceof MissingRequiredUserFieldsException) {
                return res.status(400).json(
                    ApiResponseBuilder.error(error.message)
                );
            }
            if (error instanceof BracketNotFoundException) {
                return res.status(404).json(
                    ApiResponseBuilder.error(error.message)
                );
            }
            if (error instanceof BracketNotInDraftException) {
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
     * /api/brackets/{id}/unpublish:
     *   post:
     *     summary: Unpublish bracket
     *     tags: [Brackets]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: Bracket ID
     *         schema:
     *           type: string
     *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
     *     responses:
     *       200:
     *         description: Bracket unpublished successfully
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
     *                   example: Bracket unpublished successfully
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
     *                   example: Bracket not found
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
     *                   example: Bracket not published
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
    async unpublishBracket(req: AuthRequest, res: Response) {
        try {
            const id = req.params.id;
            if (!id || typeof id !== 'string') {
                throw new MissingRequiredUserFieldsException();
            }

            await bracketService.unpublish(id);
            res.status(200).json(
                ApiResponseBuilder.success(
                    null,
                    'Bracket unpublished successfully',
                )
            );
        } catch (error: any) {
            if (error instanceof MissingRequiredUserFieldsException) {
                return res.status(400).json(
                    ApiResponseBuilder.error(error.message)
                );
            }
            if (error instanceof BracketNotFoundException) {
                return res.status(404).json(
                    ApiResponseBuilder.error(error.message)
                );
            }
            if (error instanceof BracketNotPublishedException) {
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
     * /api/brackets/{id}:
     *   delete:
     *     summary: Delete bracket
     *     tags: [Brackets]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: Bracket ID
     *         schema:
     *           type: string
     *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
     *     responses:
     *       200:
     *         description: Bracket deleted successfully
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
     *                   example: Bracket deleted successfully
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
     *                   example: Bracket not found
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
     *                   example: Bracket in progress
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
    async deleteBracket(req: AuthRequest, res: Response) {
        try {
            const id = req.params.id;
            if (!id || typeof id !== 'string') {
                throw new MissingRequiredUserFieldsException();
            }

            await bracketService.delete(id);
            res.status(200).json(
                ApiResponseBuilder.success(
                    null,
                    'Bracket deleted successfully',
                )
            );
        } catch (error: any) {
            if (error instanceof MissingRequiredUserFieldsException) {
                return res.status(400).json(
                    ApiResponseBuilder.error(error.message)
                );
            }
            if (error instanceof BracketNotFoundException) {
                return res.status(404).json(
                    ApiResponseBuilder.error(error.message)
                );
            }
            if (
                error instanceof BracketInProgressException ||
                error instanceof BracketAlreadyFinishedException
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