import { Response } from 'express';
import { UpdateUserAlias } from '../../../application/services/user/UpdateUserAlias.js';
import { UpdateUserEmail } from '../../../application/services/user/UpdateUserEmail.js';
import { UpdateUserPassword } from '../../../application/services/user/UpdateUserPassword.js';
import { PrismaUserRepository } from '../../persistence/repositories/PrismaUserRepository.js';
import { BcryptPasswordHasher } from '../../security/BcryptPasswordHasher.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { prisma } from '../../persistence/client.js';
import { ApiResponseBuilder } from '../../../application/dtos/common/ApiResponse.js';
import {
  EmailAlreadyInUseException,
  ForbiddenAccessException,
  InvalidPasswordException,
  MissingRequiredUserFieldsException,
  UserDeletedException,
  UserNotFoundException
} from '../../../domain/exceptions/UserExceptions.js';
import { UserRoles } from '../../../domain/entities/User.js';

const userRepository = new PrismaUserRepository(prisma);
const passwordHasher = new BcryptPasswordHasher();

const updateUserAlias = new UpdateUserAlias(userRepository);
const updateUserEmail = new UpdateUserEmail(userRepository);
const updateUserPassword = new UpdateUserPassword(userRepository, passwordHasher);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
 *         email:
 *           type: string
 *           example: prueba@gmail.com
 *         alias:
 *           type: string
 *           example: prueba
 *         role:
 *           type: string
 *           enum: [PLAYER, ADMIN]
 *           example: ADMIN
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, BLOCKED, DELETED]
 *           example: ACTIVE
 *         registeredAt:
 *           type: string
 *           format: date-time
 *           example: 2026-05-04T13:10:16.841Z
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - alias
 *         - role
 *       properties:
 *         email:
 *           type: string
 *           example: prueba@gmail.com
 *         password:
 *           type: string
 *           example: 123456
 *         alias:
 *           type: string
 *           example: prueba
 *         role:
 *           type: string
 *           enum: [PLAYER, ADMIN]
 *           example: ADMIN
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           example: prueba@gmail.com
 *         password:
 *           type: string
 *           example: 123456
 *     UpdateEmailRequest:
 *       type: object
 *       required:
 *         - newEmail
 *       properties:
 *         newEmail:
 *           type: string
 *           example: nuevo@gmail.com
 *     UpdatePasswordRequest:
 *       type: object
 *       required:
 *         - oldPassword
 *         - newPassword
 *       properties:
 *         oldPassword:
 *           type: string
 *           example: actual_password_123
 *         newPassword:
 *           type: string
 *           example: nueva_password_123
 *     UpdateAliasRequest:
 *       type: object
 *       required:
 *         - newAlias
 *       properties:
 *         newAlias:
 *           type: string
 *           example: nuevo_alias
 */

export class UserController {

  /**
   * @swagger
   * /api/users/{id}/email:
   *   put:
   *     summary: Update user email
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: User ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateEmailRequest'
   *     responses:
   *       200:
   *         description: Email updated successfully
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
   *                   example: Email updated successfully
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
   *                   example: Users with PLAYER role can only update their own email
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
   *                   example: Email already in use
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
  async updateEmail(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.id;
      if (!userId || typeof userId !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      const { newEmail } = req.body;
      if (!newEmail) {
        throw new MissingRequiredUserFieldsException();
      }

      if (!req.user) {
        return res.status(401).json(
          ApiResponseBuilder.error('User not authenticated')
        );
      }

      await updateUserEmail.execute({
        id: userId,
        newEmail: newEmail,
        requestor: {
          id: req.user.id,
          role: req.user.role as UserRoles,
        }
      });
      res.status(200).json(
        ApiResponseBuilder.success(null, 'Email updated successfully')
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof UserDeletedException ||
        error instanceof ForbiddenAccessException
      ) {
        return res.status(403).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof UserNotFoundException) {
        return res.status(404).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof EmailAlreadyInUseException) {
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
   * /api/users/{id}/password:
   *   put:
   *     summary: Update user password
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: User ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdatePasswordRequest'
   *     responses:
   *       200:
   *         description: Password updated successfully
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
   *                   example: Password updated successfully
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
   *                   example: User deleted
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
  async updatePassword(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.id;
      if (!userId || typeof userId !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        throw new MissingRequiredUserFieldsException();
      }

      if (!req.user) {
        return res.status(401).json(
          ApiResponseBuilder.error('User not authenticated')
        );
      }
      await updateUserPassword.execute({
        id: userId,
        oldPassword: oldPassword,
        newPassword: newPassword,
        requestor: {
          id: req.user.id,
          role: req.user.role as UserRoles,
        },
      });
      res.status(200).json(
        ApiResponseBuilder.success(null, 'Password updated successfully')
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof InvalidPasswordException) {
        return res.status(401).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof UserDeletedException ||
        error instanceof ForbiddenAccessException
      ) {
        return res.status(403).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof UserNotFoundException) {
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
   * /api/users/{id}/alias:
   *   put:
   *     summary: Update user alias
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: User ID
   *         schema:
   *           type: string
   *           example: f11e4b38-9c58-46a3-9852-d4f7f3a56c42
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateAliasRequest'
   *     responses:
   *       200:
   *         description: Alias updated successfully
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
   *                   example: Alias updated successfully
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
   *                   example: User deleted
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
  async updateAlias(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.id;
      if (!userId || typeof userId !== 'string') {
        throw new MissingRequiredUserFieldsException();
      }

      const { newAlias } = req.body;
      if (!newAlias) {
        throw new MissingRequiredUserFieldsException();
      }

      if (!req.user) {
        return res.status(401).json(
          ApiResponseBuilder.error('User not authenticated')
        );
      }

      await updateUserAlias.execute({
        id: userId,
        newAlias: newAlias,
        requestor: {
          id: req.user.id,
          role: req.user.role as UserRoles,
        }
      });
      res.status(200).json(
        ApiResponseBuilder.success(null, 'Alias updated successfully')
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof UserDeletedException ||
        error instanceof ForbiddenAccessException
      ) {
        return res.status(403).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof UserNotFoundException) {
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
