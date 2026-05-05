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
  InvalidPasswordException,
  InvalidUserFieldException,
  UserDeletedException,
  UserNotFoundException
} from '../../../domain/exceptions/UserExceptions.js';

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
 *           enum: [player, admin]
 *           example: admin
 *         status:
 *           type: string
 *           enum: [active, inactive, blocked, deleted]
 *           example: active
 *         registratedAt:
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
 *           enum: [player, admin]
 *           example: admin
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
   * /api/users/email:
   *   put:
   *     summary: Update user email
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateEmailRequest'
   *     responses:
   *       200:
   *         description: Correo actualizado correctamente
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
   *                   example: Correo actualizado correctamente
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
   *                   example: El nuevo correo es obligatorio
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
   *                   example: Token no proporcionado
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
   *                   example: Usuario eliminado
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
   *                   example: Usuario no encontrado
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
   *                   example: Correo ya en uso
   *       500:
   *         description: Error interno del servidor
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
   *                   example: Error interno del servidor
   */
  async updateEmail(req: AuthRequest, res: Response) {
    try {
      const { newEmail } = req.body;
      if (!newEmail) {
        throw new InvalidUserFieldException('El nuevo correo es obligatorio');
      }

      if (!req.user) {
        return res.status(401).json(
          ApiResponseBuilder.error('Usuario no autenticado')
        );
      }

      await updateUserEmail.execute({
        id: req.user.id,
        newEmail: newEmail,
      });
      res.status(200).json(
        ApiResponseBuilder.success(null, 'Correo actualizado correctamente')
      );
    } catch (error: any) {
      if (error instanceof InvalidUserFieldException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof UserDeletedException) {
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
        ApiResponseBuilder.error('Error interno del servidor')
      );
    }
  }

  /**
   * @swagger
   * /api/users/password:
   *   put:
   *     summary: Update user password
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdatePasswordRequest'
   *     responses:
   *       200:
   *         description: Contraseña actualizada correctamente
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
   *                   example: Contraseña actualizada correctamente
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
   *                   example: La anterior y la nueva contraseña son obligatorias
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
   *                   example: Token no proporcionado
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
   *                   example: Usuario eliminado
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
   *                   example: Usuario no encontrado
   *       500:
   *         description: Error interno del servidor
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
   *                   example: Error interno del servidor
   */
  async updatePassword(req: AuthRequest, res: Response) {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        throw new InvalidUserFieldException('La anterior y la nueva contraseña son obligatorias');
      }

      if (!req.user) {
        return res.status(401).json(
          ApiResponseBuilder.error('Usuario no autenticado')
        );
      }
      await updateUserPassword.execute({
        id: req.user.id,
        oldPassword: oldPassword,
        newPassword: newPassword,
      });
      res.status(200).json(
        ApiResponseBuilder.success(null, 'Contraseña actualizada correctamente')
      );
    } catch (error: any) {
      if (error instanceof InvalidUserFieldException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof InvalidPasswordException) {
        return res.status(401).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof UserDeletedException) {
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
        ApiResponseBuilder.error('Error interno del servidor')
      );
    }
  }

  /**
   * @swagger
   * /api/users/alias:
   *   put:
   *     summary: Update user alias
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateAliasRequest'
   *     responses:
   *       200:
   *         description: Alias actualizado correctamente
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
   *                   example: Alias actualizado correctamente
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
   *                   example: El nuevo alias es obligatorio
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
   *                   example: Token no proporcionado
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
   *                   example: Usuario eliminado
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
   *                   example: Usuario no encontrado
   *       500:
   *         description: Error interno del servidor
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
   *                   example: Error interno del servidor
   */
  async updateAlias(req: AuthRequest, res: Response) {
    try {
      const { newAlias } = req.body;
      if (!newAlias) {
        throw new InvalidUserFieldException('El nuevo alias es obligatorio');
      }

      if (!req.user) {
        return res.status(401).json(
          ApiResponseBuilder.error('Usuario no autenticado')
        );
      }

      await updateUserAlias.execute({
        id: req.user.id,
        newAlias: newAlias,
      });
      res.status(200).json(
        ApiResponseBuilder.success(null, 'Alias actualizado exitosamente')
      );
    } catch (error: any) {
      if (error instanceof InvalidUserFieldException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof UserDeletedException) {
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
        ApiResponseBuilder.error('Error interno del servidor')
      );
    }
  }
}
