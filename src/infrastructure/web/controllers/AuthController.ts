import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { RegisterUser } from '../../../application/services/user/RegisterUser.js';
import { LoginUser } from '../../../application/services/user/LoginUser.js';
import { PrismaUserRepository } from '../../persistence/repositories/PrismaUserRepository.js';
import { BcryptPasswordHasher } from '../../security/BcryptPasswordHasher.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { prisma } from '../../persistence/client.js';
import { ApiResponseBuilder } from '../../../application/dtos/common/ApiResponse.js';
import { redis } from '../../redis/redisClient.js';
import {
  EmailAlreadyInUseException,
  InvalidCredentialsException,
  InvalidUserFieldException,
  UserBlockedException,
  UserDeletedException,
  UserNotFoundException
} from '../../../domain/exceptions/UserExceptions.js';
import { GetUserData } from '../../../application/services/user/GetUserData.js';

const userRepository = new PrismaUserRepository(prisma);
const passwordHasher = new BcryptPasswordHasher();

const getUserData = new GetUserData(userRepository);
const registerUser = new RegisterUser(userRepository, passwordHasher);
const loginUser = new LoginUser(userRepository, passwordHasher);

export class AuthController {
  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterRequest'
   *     responses:
   *       201:
   *         description: Usuario registrado correctamente
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
   *                   example: Usuario registrado correctamente
   *                 data:
   *                   $ref: '#/components/schemas/User'
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
   *                   example: Correo, contraseña, alias y rol son obligatorios
   *       409:
   *         description: Bad request
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
  async register(req: Request, res: Response) {
    try {
      const userDto = await registerUser.execute(req.body);
      return res.status(201).json(
        ApiResponseBuilder.success(
          userDto,
          "Usuario registrado correctamente",
        )
      );
    } catch (error: any) {
      if (error instanceof InvalidUserFieldException) {
        return res.status(400).json(
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
   * /api/auth/login:
   *   post:
   *     summary: Login user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Inicio de sesión correcto
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
   *                   example: Inicio de sesión correcto
   *                 data:
   *                   type: object
   *                   properties:
   *                     token:
   *                       type: string
   *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6InBydWViYUBnbWFpbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MTI1MTYzMzcsImV4cCI6MTcxMjYwMjczN30.A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2
   *                     user:
   *                       $ref: '#/components/schemas/User'
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
   *                   example: Correo y contraseña son obligatorios
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
   *                   example: Credenciales inválidas
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
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new InvalidUserFieldException('Correo y contraseña son obligatorios');
      }

      const userDto = await loginUser.execute(req.body);

      const token = jwt.sign(
        { id: userDto.id, email: userDto.email, role: userDto.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '24h' }
      );

      res.status(200).json(
        ApiResponseBuilder.success(
          { token, user: userDto },
          'Inicio de sesión correcto'
        )
      );
    } catch (error: any) {
      if (error instanceof InvalidUserFieldException) {
        return res.status(400).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (error instanceof InvalidCredentialsException) {
        return res.status(401).json(
          ApiResponseBuilder.error(error.message)
        );
      }
      if (
        error instanceof UserDeletedException ||
        error instanceof UserBlockedException
      ) {
        return res.status(403).json(
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
   * /api/auth/logout:
   *   post:
   *     summary: Logout user
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Cierre de sesión correcto
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
   *                   example: Cierre de sesión correcto
   *                 data:
   *                   type: string
   *                   example: null
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
  async logout(req: AuthRequest, res: Response) {
    try {
      const token = req.token;

      if (!token) {
        return res.status(401).json(
          ApiResponseBuilder.error('Token no proporcionado')
        );
      }

      const decoded = jwt.decode(token) as { exp: number };

      if (decoded && decoded.exp) {
        const now = Math.floor(Date.now() / 1000);
        const ttl = decoded.exp - now;

        if (ttl > 0) {
          await redis.set(`blacklist:${token}`, 'true', 'EX', ttl);
        }
      }

      res.status(200).json(
        ApiResponseBuilder.success(
          null,
          'Cierre de sesión correcto',
        )
      );
    } catch (error: any) {
      console.error('[ERROR]:', error);
      res.status(500).json(
        ApiResponseBuilder.error('Error interno del servidor')
      );
    }
  }

  /**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user data
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del usuario devuelta correctamente
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
 *                   example: Información del usuario devuelta correctamente
 *                 data:
 *                   $ref: '#/components/schemas/User'
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
  async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(
          ApiResponseBuilder.error('Usuario no autenticado')
        );
      }
      const userDto = await getUserData.execute(req.user.id);
      res.status(200).json(
        ApiResponseBuilder.success(
          userDto,
          'Información del usuario devuelta correctamente',
        )
      );
    } catch (error: any) {
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
