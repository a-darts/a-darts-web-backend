import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

const mockUserService = vi.hoisted(() => ({
  getAll: vi.fn(),
  getById: vi.fn(),
  registerByAdmin: vi.fn(),
  updateEmail: vi.fn(),
  updatePassword: vi.fn(),
}));

const mockTournamentResultsService = vi.hoisted(() => ({
  // Not used in the tested methods directly but needed for factory
}));

vi.mock('../../../../infrastructure/factories/UserServiceFactory.js', () => ({
  default: {
    getInstance: vi.fn(() => mockUserService),
  },
}));

vi.mock('../../../../infrastructure/factories/TournamentResultsServiceFactory.js', () => ({
  default: {
    getInstance: vi.fn(() => mockTournamentResultsService),
  },
}));

import { UserController } from '../../../../infrastructure/web/controllers/UserController.js';
import { MissingRequiredUserFieldsException, UserNotFoundException } from '../../../../domain/exceptions/UserExceptions.js';

describe('UserController', () => {
  let controller: UserController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: any;
  let mockStatus: any;

  beforeEach(() => {
    controller = new UserController();

    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    mockResponse = {
      status: mockStatus,
    };

    vi.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return 200 and users successfully', async () => {
      mockRequest = {
        query: { page: '1', limit: '10' },
      };

      const mockUsers = { users: [], pagination: { total: 0 } };
      mockUserService.getAll.mockResolvedValue(mockUsers);

      await controller.getAllUsers(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.getAll).toHaveBeenCalledWith(1, 10);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Users fetched successfully',
        data: mockUsers,
      });
    });

    it('should return 400 for invalid page number', async () => {
      mockRequest = { query: { page: '-1' } };

      await controller.getAllUsers(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid page number',
      });
    });
  });

  describe('getUserById', () => {
    it('should return 200 and user successfully', async () => {
      mockRequest = { params: { id: 'user-id' } };
      
      const mockUser = { id: 'user-id' };
      mockUserService.getById.mockResolvedValue(mockUser);

      await controller.getUserById(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.getById).toHaveBeenCalledWith('user-id');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'User fetched successfully',
        data: mockUser,
      });
    });

    it('should return 400 when id is missing', async () => {
      mockRequest = { params: {} };

      await controller.getUserById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new MissingRequiredUserFieldsException().message,
      });
    });

    it('should return 404 when user is not found', async () => {
      mockRequest = { params: { id: 'user-id' } };
      mockUserService.getById.mockRejectedValue(new UserNotFoundException());

      await controller.getUserById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new UserNotFoundException().message,
      });
    });
  });
});
