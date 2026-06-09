import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

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

vi.mock('../../../../infrastructure/persistence/redisClient.js', () => ({
  redis: {
    set: vi.fn(),
  },
}));

vi.mock('../../../../infrastructure/factories/UserServiceFactory.js', () => ({
  default: {
    getInstance: vi.fn(() => mockService),
  },
}));

import { AuthController } from '../../../../infrastructure/web/controllers/AuthController.js';
import { EmailAlreadyInUseException, MissingRequiredUserFieldsException, InvalidCredentialsException } from '../../../../domain/exceptions/UserExceptions.js';
import jwt from 'jsonwebtoken';

describe('AuthController', () => {
  let controller: AuthController;
  let mockRequest: Partial<Request>;
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
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

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
});
