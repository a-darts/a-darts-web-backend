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
  MissingRequiredUserFieldsException,
  UserBlockedException,
  UserDeletedException,
  UserInactiveException,
  UserNotFoundException
} from '../../../domain/exceptions/UserExceptions.js';
import { GetUserData } from '../../../application/services/user/GetUserData.js';

const userRepository = new PrismaUserRepository(prisma);
const passwordHasher = new BcryptPasswordHasher();

const getUserData = new GetUserData(userRepository);
const registerUser = new RegisterUser(userRepository, passwordHasher);
const loginUser = new LoginUser(userRepository, passwordHasher);


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
 *         registeredAt:
 *           type: string
 *           format: date-time
 *           example: 2026-05-04T13:10:16.841Z
 * 
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
 * 
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
 */
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
   *         description: User registered successfully
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
   *                   example: User registered successfully
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
   *                   example: All fields are required
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
  async register(req: Request, res: Response) {
    try {
      const user = await registerUser.execute(req.body);
      return res.status(201).json(
        ApiResponseBuilder.success(
          user,
          "User registered successfully",
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
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
        ApiResponseBuilder.error('Internal server error')
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
   *         description: User logged in successfully
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
   *                   example: User logged in successfully
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
   *                   example: Invalid credentials
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
   *                   oneOf:
   *                     - example: User deleted
   *                     - example: User blocked
   *                     - example: User inactive
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
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new MissingRequiredUserFieldsException();
      }

      const user = await loginUser.execute(req.body);

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '24h' }
      );

      res.status(200).json(
        ApiResponseBuilder.success(
          { token, user: user },
          'User logged in successfully'
        )
      );
    } catch (error: any) {
      if (error instanceof MissingRequiredUserFieldsException) {
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
        error instanceof UserBlockedException ||
        error instanceof UserInactiveException
      ) {
        return res.status(403).json(
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
   * /api/auth/logout:
   *   post:
   *     summary: Logout user
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Logout successfull
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
   *                   example: Logout successfull
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
  async logout(req: AuthRequest, res: Response) {
    try {
      const token = req.token;

      if (!token) {
        return res.status(401).json(
          ApiResponseBuilder.error('No token provided')
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
          'Logout successful',
        )
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
   * /api/auth/me:
   *   get:
   *     summary: Get current user data
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User data retrieved successfully
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
   *                   example: User data retrieved successfully
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
  async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(
          ApiResponseBuilder.error('User not authenticated')
        );
      }
      const user = await getUserData.execute(req.user.id);
      res.status(200).json(
        ApiResponseBuilder.success(
          user,
          'User data retrieved successfully',
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
        ApiResponseBuilder.error('Internal server error')
      );
    }
  }
}
