import { Response } from 'express';
import { ApiResponseBuilder } from "../../../application/dtos/common/ApiResponse.js";
import { SwapBracketPositions } from "../../../application/services/bracket/SwapBracketPositions.js";
import { BracketNotFoundException, BracketNotInDraftException, BracketNotInDraftOrPublisedException, BracketNotPublishedException, DuplicateParticipantsException, InvalidPositionsException } from "../../../domain/exceptions/BracketExceptions.js";
import { MissingRequiredUserFieldsException } from "../../../domain/exceptions/UserExceptions.js";
import { prisma } from "../../persistence/client.js";
import { PrismaBracketRepository } from "../../persistence/repositories/PrismaBracketRepository.js";
import { AuthRequest } from "../middlewares/authMiddleware.js";
import { ReshuffleBracket } from '../../../application/services/bracket/ReshuffleBracket.js';
import { PublishBracket } from '../../../application/services/bracket/PublishBracket.js';
import { UnpublishBracket } from '../../../application/services/bracket/UnpublishBracket.js';
import { AssignParticipantsToBracketPositions } from '../../../application/services/bracket/AssignParticipantsToBracketPositions.js';
import { PrismaRegisteredParticipantRepository } from '../../persistence/repositories/PrismaRegisteredParticipantRepository.js';
import { RegisteredParticipantNotFoundException } from '../../../domain/exceptions/ParticipantExceptions.js';


const bracketRepository = new PrismaBracketRepository(prisma);
const registeredParticipantRepository = new PrismaRegisteredParticipantRepository(prisma);


const swapBracketPositions = new SwapBracketPositions(bracketRepository);
const assignParticipantsToBracketPositions = new AssignParticipantsToBracketPositions(bracketRepository, registeredParticipantRepository);
const reshuffleBracket = new ReshuffleBracket(bracketRepository);
const publishBracket = new PublishBracket(bracketRepository);
const unpublishBracket = new UnpublishBracket(bracketRepository);

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
     * /api/brackets/{id}/swapPositions:
     *   put:
     *     summary: Swap positions in the bracket
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
     *             $ref: '#/components/schemas/UpdateBracketPositionsRequest'
     *     responses:
     *       200:
     *         description: Positions swapped successfully
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
     *                   example: Positions swapped successfully
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
    async swapPositions(req: AuthRequest, res: Response) {
        try {
            const id = req.params.id;
            if (!id || typeof id !== 'string') {
                throw new MissingRequiredUserFieldsException();
            }

            const { position1, position2 } = req.body;
            if (!position1 || !position2 || typeof position1 !== 'number' || typeof position2 !== 'number') {
                throw new MissingRequiredUserFieldsException();
            }

            await swapBracketPositions.execute({
                id: id,
                position1: position1,
                position2: position2,
            });
            res.status(200).json(
                ApiResponseBuilder.success(
                    null,
                    'Positions swapped successfully',
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
     * /api/brackets/{id}/setupPositions:
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

            await assignParticipantsToBracketPositions.execute({
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

            const bracket = await reshuffleBracket.execute({
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

            await publishBracket.execute(id);
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

            await unpublishBracket.execute(id);
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
}