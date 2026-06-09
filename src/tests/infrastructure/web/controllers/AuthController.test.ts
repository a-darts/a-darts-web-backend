import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { AuthController } from '../../../../infrastructure/web/controllers/AuthController.js';
import {
  EmailAlreadyInUseException,
  MissingRequiredUserFieldsException,
  InvalidCredentialsException,
  UserNotFoundException,
  UserNotInactiveException,
  UserDeletedException,
  UserAlreadyActiveException
} from '../../../../domain/exceptions/UserExceptions.js';
import { MailerSendException } from '../../../../domain/exceptions/MailerExceptions.js';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../../../../infrastructure/web/middlewares/authMiddleware.js';


const mockService = vi.hoisted(() => ({
  registerSelf: vi.fn(),
  login: vi.fn(),
  activateAccount: vi.fn(),
  createTemporaryPassword: vi.fn(),
  getById: vi.fn(),
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mocked-jwt-token'),
    decode: vi.fn(),
  },
}));

const mockRedis = vi.hoisted(() => ({
  set: vi.fn(),
}));

vi.mock('../../../../infrastructure/persistence/redisClient.js', () => ({
  redis: mockRedis,
}));

vi.mock('../../../../infrastructure/factories/UserServiceFactory.js', () => ({
  default: {
    getInstance: vi.fn(() => mockService),
  },
}));


describe('AuthController', () => {
  let controller: AuthController;
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockJson: any;
  let mockStatus: any;

  beforeEach(() => {
    controller = new AuthController();

    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    mockResponse = {
      status: mockStatus,
    };

    process.env.JWT_SECRET = 'test-secret';

    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should return 201 when registered successfully', async () => {
      mockRequest = {
        body: { email: 'test@test.com', password: 'pwd', alias: 'alias' },
      };

      const mockUser = { id: 'u1', email: 'test@test.com' };
      mockService.registerSelf.mockResolvedValue(mockUser);

      await controller.register(mockRequest as Request, mockResponse as Response);

      expect(mockService.registerSelf).toHaveBeenCalledWith(mockRequest.body);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'User registered successfully',
        data: mockUser,
      });
    });

    it('should return 400 when fields are missing', async () => {
      mockRequest = { body: {} };

      mockService.registerSelf.mockRejectedValue(new MissingRequiredUserFieldsException());

      await controller.register(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        message: new MissingRequiredUserFieldsException().message,
      }));
    });

    it('should return 409 when email exists', async () => {
      mockRequest = { body: { email: 'test@test.com' } };

      mockService.registerSelf.mockRejectedValue(new EmailAlreadyInUseException());

      await controller.register(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        message: new EmailAlreadyInUseException().message,
      }));
    });

    it('should return 500 on unexpected errors', async () => {
      mockRequest = { body: {} };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      mockService.registerSelf.mockRejectedValue(new Error('Unknown'));

      await controller.register(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      consoleSpy.mockRestore();
    });
  });

  describe('login', () => {
    it('should return 200 and token on success', async () => {
      mockRequest = {
        body: { email: 'test@test.com', password: 'pwd' },
      };

      const mockUser = { id: 'u1', email: 'test@test.com', role: 'ADMIN' };
      mockService.login.mockResolvedValue(mockUser);

      await controller.login(mockRequest as Request, mockResponse as Response);

      expect(mockService.login).toHaveBeenCalledWith(mockRequest.body);
      expect(jwt.sign).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'User logged in successfully',
        data: {
          token: 'mocked-jwt-token',
          user: mockUser,
        },
      });
    });

    it('should return 400 when fields are missing', async () => {
      mockRequest = { body: {} };

      await controller.login(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 401 for invalid credentials', async () => {
      mockRequest = { body: { email: 't', password: 'p' } };
      mockService.login.mockRejectedValue(new InvalidCredentialsException());

      await controller.login(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
    });
  });

  describe('logout', () => {
    it('should return 200 and blacklist token on success', async () => {
      mockRequest = { token: 'mocked-jwt-token' };
      const exp = Math.floor(Date.now() / 1000) + 3600;
      (jwt.decode as any).mockReturnValue({ exp });

      await controller.logout(mockRequest as AuthRequest, mockResponse as Response);

      expect(jwt.decode).toHaveBeenCalledWith('mocked-jwt-token');
      expect(mockRedis.set).toHaveBeenCalledWith('blacklist:mocked-jwt-token', 'true', 'EX', expect.any(Number));
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Logout successful',
        data: null,
      });
    });

    it('should return 401 if no token provided', async () => {
      mockRequest = {};

      await controller.logout(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        message: 'No token provided',
      }));
    });

    it('should return 500 on unexpected errors', async () => {
      mockRequest = { token: 'mocked-jwt-token' };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      (jwt.decode as any).mockImplementation(() => {
        throw new Error('Unknown error');
      });

      await controller.logout(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      consoleSpy.mockRestore();
    });
  });

  describe('getMe', () => {
    it('should return 200 and user data successfully', async () => {
      mockRequest = { user: { id: 'u1' } as any };
      const mockUser = { id: 'u1', email: 'test@test.com' };
      mockService.getById.mockResolvedValue(mockUser);

      await controller.getMe(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockService.getById).toHaveBeenCalledWith('u1');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'User data retrieved successfully',
        data: mockUser,
      });
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest = {};

      await controller.getMe(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        message: 'User not authenticated',
      }));
    });

    it('should return 404 if user not found', async () => {
      mockRequest = { user: { id: 'u1' } as any };
      mockService.getById.mockRejectedValue(new UserNotFoundException());

      await controller.getMe(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        message: new UserNotFoundException().message,
      }));
    });
  });

  describe('activateAccount', () => {
    it('should return 200 when account activated successfully', async () => {
      mockRequest = {
        body: { email: 'test@test.com', temporaryPassword: 'temp', newPassword: 'new' },
      };

      await controller.activateAccount(mockRequest as Request, mockResponse as Response);

      expect(mockService.activateAccount).toHaveBeenCalledWith({ email: 'test@test.com', temporaryPassword: 'temp', newPassword: 'new' });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Account activated successfully',
        data: null,
      });
    });

    it('should return 400 when fields are missing', async () => {
      mockRequest = { body: {} };

      await controller.activateAccount(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 401 on invalid credentials', async () => {
      mockRequest = { body: { email: 'e', temporaryPassword: 't', newPassword: 'n' } };
      mockService.activateAccount.mockRejectedValue(new InvalidCredentialsException());

      await controller.activateAccount(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
    });

    it('should return 404 on user not found', async () => {
      mockRequest = { body: { email: 'e', temporaryPassword: 't', newPassword: 'n' } };
      mockService.activateAccount.mockRejectedValue(new UserNotFoundException());

      await controller.activateAccount(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 on user deleted', async () => {
      mockRequest = { body: { email: 'e', temporaryPassword: 't', newPassword: 'n' } };
      mockService.activateAccount.mockRejectedValue(new UserDeletedException());

      await controller.activateAccount(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('forgotPassword', () => {
    it('should return 200 when temporary password sent', async () => {
      mockRequest = { body: { email: 'test@test.com' } };

      await controller.forgotPassword(mockRequest as Request, mockResponse as Response);

      expect(mockService.createTemporaryPassword).toHaveBeenCalledWith({ email: 'test@test.com' });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Temporary password sent successfully',
        data: null,
      });
    });

    it('should return 400 when email is missing', async () => {
      mockRequest = { body: {} };

      await controller.forgotPassword(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when user not found', async () => {
      mockRequest = { body: { email: 'test@test.com' } };
      mockService.createTemporaryPassword.mockRejectedValue(new UserNotFoundException());

      await controller.forgotPassword(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when user deleted', async () => {
      mockRequest = { body: { email: 'test@test.com' } };
      mockService.createTemporaryPassword.mockRejectedValue(new UserDeletedException());

      await controller.forgotPassword(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
    });

    it('should return 502 when mailer fails', async () => {
      mockRequest = { body: { email: 'test@test.com' } };
      mockService.createTemporaryPassword.mockRejectedValue(new MailerSendException());

      await controller.forgotPassword(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(502);
    });
  });
});
