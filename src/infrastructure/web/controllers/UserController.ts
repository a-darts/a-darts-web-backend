import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { RegisterUser } from '../../../application/services/user/RegisterUser.js';
import { LoginUser } from '../../../application/services/user/LoginUser.js';
import { GetUserData } from '../../../application/services/user/GetUserData.js';
import { UpdateUserAlias } from '../../../application/services/user/UpdateUserAlias.js';
import { UpdateUserEmail } from '../../../application/services/user/UpdateUserEmail.js';
import { UpdateUserPassword } from '../../../application/services/user/UpdateUserPassword.js';
import { PrismaUserRepository } from '../../persistence/repositories/PrismaUserRepository.js';
import { BcryptPasswordHasher } from '../../security/BcryptPasswordHasher.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { prisma } from '../../persistence/client.js';
import { ApiResponseBuilder } from '../../../application/dtos/common/ApiResponse.js';
import { redis } from '../../redis/redisClient.js';

const userRepository = new PrismaUserRepository(prisma);
const passwordHasher = new BcryptPasswordHasher();

const registerUser = new RegisterUser(userRepository, passwordHasher);
const loginUser = new LoginUser(userRepository, passwordHasher);
const getUserData = new GetUserData(userRepository);
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
   * /api/users/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Users]
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
   *                   example: User already exists
   */
  async register(req: Request, res: Response) {
    try {
      const userDto = await registerUser.execute(req.body);
      return res.status(201).json(
        ApiResponseBuilder.success(
          userDto,
          "User registered successfully",
        )
      );
    } catch (error: any) {
      res.status(400).json(
        ApiResponseBuilder.error(error.message)
      );
    }
  }

  /**
   * @swagger
   * /api/users/login:
   *   post:
   *     summary: Login user
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Login successful
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
   *                   example: Login successful
   *                 data:
   *                   type: object
   *                   properties:
   *                     token:
   *                       type: string
   *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6InBydWViYUBnbWFpbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MTI1MTYzMzcsImV4cCI6MTcxMjYwMjczN30.A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *       400:
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
   *                   example: Invalid credentials
   */
  async login(req: Request, res: Response) {
    try {
      const userDto = await loginUser.execute(req.body);

      const token = jwt.sign(
        { id: userDto.id, email: userDto.email, role: userDto.role },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '24h' }
      );

      res.status(200).json(
        ApiResponseBuilder.success(
          { token, user: userDto },
          'Login successful'
        )
      );
    } catch (error: any) {
      res.status(400).json(
        ApiResponseBuilder.error(error.message)
      );
    }
  }

  /**
   * @swagger
   * /api/users/logout:
   *   post:
   *     summary: Logout user (clears token on client side)
   *     tags: [Users]
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
   */
  async logout(req: AuthRequest, res: Response) {
    try {
      const token = req.token;

      if (!token) {
        return res.status(401).json(
          ApiResponseBuilder.error('No token provided')
        );
      }

      // Decode token to get expiration
      const decoded = jwt.decode(token) as { exp: number };

      if (decoded && decoded.exp) {
        const now = Math.floor(Date.now() / 1000);
        const ttl = decoded.exp - now;

        if (ttl > 0) {
          // Store token in Redis with TTL
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
      res.status(500).json(
        ApiResponseBuilder.error('Error during logout')
      );
    }
  }

  /**
   * @swagger
   * /api/users/me:
   *   get:
   *     summary: Get current user data
   *     tags: [Users]
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
   */
  async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(400).json(
          ApiResponseBuilder.error('User not authenticated')
        );
      }
      const userDto = await getUserData.execute(req.user.id);
      res.status(200).json(
        ApiResponseBuilder.success(
          userDto,
          'User data retrieved successfully',
        )
      );
    } catch (error: any) {
      res.status(401).json(
        ApiResponseBuilder.error(error.message)
      );
    }
  }

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
   *                   example: Email already in use
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
   */
  async updateEmail(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(400).json(
          ApiResponseBuilder.error('User not authenticated')
        );
      }

      await updateUserEmail.execute({
        id: req.user.id,
        newEmail: req.body.newEmail
      });
      res.status(200).json(
        ApiResponseBuilder.success(null, 'Email updated successfully')
      );
    } catch (error: any) {
      res.status(400).json(ApiResponseBuilder.error(error.message));
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
   *                   example: Incorrect old password
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
   */
  async updatePassword(req: AuthRequest, res: Response) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      await updateUserPassword.execute({
        id: req.user.id,
        oldPassword: req.body.oldPassword,
        newPassword: req.body.newPassword
      });
      res.status(200).json(
        ApiResponseBuilder.success(null, 'Password updated successfully')
      );
    } catch (error: any) {
      res.status(400).json(ApiResponseBuilder.error(error.message));
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
   */
  async updateAlias(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(400).json(
          ApiResponseBuilder.error('User not authenticated')
        );
      }

      await updateUserAlias.execute({
        id: req.user.id,
        newAlias: req.body.newAlias
      });
      res.status(200).json(
        ApiResponseBuilder.success(null, 'Alias updated successfully')
      );
    } catch (error: any) {
      res.status(400).json(ApiResponseBuilder.error(error.message));
    }
  }
}
