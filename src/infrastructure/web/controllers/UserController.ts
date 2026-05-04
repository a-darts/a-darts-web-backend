import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { RegisterUser } from '../../../application/services/user/RegisterUser.js';
import { LoginUser } from '../../../application/services/user/LoginUser.js';
import { GetUserData } from '../../../application/services/user/GetUserData.js';
import { PrismaUserRepository } from '../../persistence/repositories/PrismaUserRepository.js';
import { BcryptPasswordHasher } from '../../security/BcryptPasswordHasher.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { prisma } from '../../persistence/client.js';
import { ApiResponseBuilder } from '../../../application/dtos/common/ApiResponse.js';

const userRepository = new PrismaUserRepository(prisma);
const passwordHasher = new BcryptPasswordHasher();

const registerUser = new RegisterUser(userRepository, passwordHasher);
const loginUser = new LoginUser(userRepository, passwordHasher);
const getUserData = new GetUserData(userRepository);

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
   *                 success:
   *                   type: boolean
   *                 token:
   *                   type: string
   *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlkOTNjOGNkLWRkMWQtNGU0NS05YmYzLTljMTU2NDljYmVmOCIsImVtYWlsIjoicHJ1ZWJhQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NzkwMDU5NywiZXhwIjoxNzc3OTg2OTk3fQ.QzDfv8xYEfZ8hVgxzjqv4n6qljI6jniBondyWDBqDKQ
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized
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
      res.status(401).json(
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
   *     responses:
   *       200:
   *         description: Logout successful
   */
  async logout(req: Request, res: Response) {
    // In JWT, logout is usually handled by the client by deleting the token.
    // Here we just return success.
    res.status(200).json(
      ApiResponseBuilder.success(
        null,
        'Logout successful',
      )
    );
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
   *         description: User data retrieved
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized
   */
  async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      const userDto = await getUserData.execute(req.user.id);
      res.status(200).json(
        ApiResponseBuilder.success(
          userDto,
          'User data retrieved',
        )
      );
    } catch (error: any) {
      res.status(401).json(
        ApiResponseBuilder.error(error.message)
      );
    }
  }
}
