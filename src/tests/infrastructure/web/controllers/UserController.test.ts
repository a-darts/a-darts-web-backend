import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { UserController } from '../../../../infrastructure/web/controllers/UserController.js';
import {
  MissingRequiredUserFieldsException,
  UserNotFoundException,
  EmailAlreadyInUseException,
  InvalidPasswordException,
  UserDeletedException,
  UserNotActiveException,
  UserAlreadyBlockedException,
  UserNotBlockedException,
  UserAlreadyDeletedException,
  UserNotDeletedException,
} from '../../../../domain/exceptions/UserExceptions.js';
import { MailerSendException } from '../../../../domain/exceptions/MailerExceptions.js';


const mockUserService = vi.hoisted(() => ({
  getAll: vi.fn(),
  getById: vi.fn(),
  registerByAdmin: vi.fn(),
  updateEmail: vi.fn(),
  updatePassword: vi.fn(),
  updateAlias: vi.fn(),
  block: vi.fn(),
  unblock: vi.fn(),
  delete: vi.fn(),
  restore: vi.fn(),
}));

const mockTournamentResultsService = vi.hoisted(() => ({
  getStatsByUserId: vi.fn(),
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

  describe('createUser', () => {
    it('should return 201 on success', async () => {
      mockRequest = { body: { email: 'a@a.com', name: 'A' } };
      mockUserService.registerByAdmin.mockResolvedValue({ id: 'u1' });
      await controller.createUser(mockRequest as Request, mockResponse as Response);
      expect(mockUserService.registerByAdmin).toHaveBeenCalledWith(mockRequest.body);
      expect(mockStatus).toHaveBeenCalledWith(201);
    });

    it('should return 400 when missing fields', async () => {
      mockRequest = { body: {} };
      mockUserService.registerByAdmin.mockRejectedValue(new MissingRequiredUserFieldsException());
      await controller.createUser(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 409 when email in use', async () => {
      mockRequest = { body: { email: 'a@a.com', name: 'A' } };
      mockUserService.registerByAdmin.mockRejectedValue(new EmailAlreadyInUseException());
      await controller.createUser(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });

    it('should return 502 on mailer error', async () => {
      mockRequest = { body: { email: 'a@a.com', name: 'A' } };
      mockUserService.registerByAdmin.mockRejectedValue(new MailerSendException());
      await controller.createUser(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(502);
    });
  });

  describe('updateEmail', () => {
    it('should return 200 on success', async () => {
      mockRequest = { params: { id: 'u1' }, body: { newEmail: 'b@b.com' } };
      await controller.updateEmail(mockRequest as Request, mockResponse as Response);
      expect(mockUserService.updateEmail).toHaveBeenCalledWith({ id: 'u1', newEmail: 'b@b.com' });
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when missing fields', async () => {
      mockRequest = { params: { id: 'u1' }, body: {} };
      await controller.updateEmail(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 403 when user is deleted', async () => {
      mockRequest = { params: { id: 'u1' }, body: { newEmail: 'b@b.com' } };
      mockUserService.updateEmail.mockRejectedValue(new UserDeletedException());
      await controller.updateEmail(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(403);
    });

    it('should return 404 when user not found', async () => {
      mockRequest = { params: { id: 'u1' }, body: { newEmail: 'b@b.com' } };
      mockUserService.updateEmail.mockRejectedValue(new UserNotFoundException());
      await controller.updateEmail(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when email in use', async () => {
      mockRequest = { params: { id: 'u1' }, body: { newEmail: 'b@b.com' } };
      mockUserService.updateEmail.mockRejectedValue(new EmailAlreadyInUseException());
      await controller.updateEmail(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('updatePassword', () => {
    it('should return 200 on success', async () => {
      mockRequest = { params: { id: 'u1' }, body: { oldPassword: 'old', newPassword: 'new' } };
      await controller.updatePassword(mockRequest as Request, mockResponse as Response);
      expect(mockUserService.updatePassword).toHaveBeenCalledWith({ id: 'u1', oldPassword: 'old', newPassword: 'new' });
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when missing fields', async () => {
      mockRequest = { params: { id: 'u1' }, body: {} };
      await controller.updatePassword(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 401 on invalid password', async () => {
      mockRequest = { params: { id: 'u1' }, body: { oldPassword: 'old', newPassword: 'new' } };
      mockUserService.updatePassword.mockRejectedValue(new InvalidPasswordException());
      await controller.updatePassword(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(401);
    });

    it('should return 403 when user is deleted', async () => {
      mockRequest = { params: { id: 'u1' }, body: { oldPassword: 'old', newPassword: 'new' } };
      mockUserService.updatePassword.mockRejectedValue(new UserDeletedException());
      await controller.updatePassword(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(403);
    });

    it('should return 404 when user not found', async () => {
      mockRequest = { params: { id: 'u1' }, body: { oldPassword: 'old', newPassword: 'new' } };
      mockUserService.updatePassword.mockRejectedValue(new UserNotFoundException());
      await controller.updatePassword(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('updateAlias', () => {
    it('should return 200 on success', async () => {
      mockRequest = { params: { id: 'u1' }, body: { newAlias: 'alias1' } };
      await controller.updateAlias(mockRequest as Request, mockResponse as Response);
      expect(mockUserService.updateAlias).toHaveBeenCalledWith({ id: 'u1', newAlias: 'alias1' });
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when missing fields', async () => {
      mockRequest = { params: { id: 'u1' }, body: {} };
      await controller.updateAlias(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 403 when user is deleted', async () => {
      mockRequest = { params: { id: 'u1' }, body: { newAlias: 'alias1' } };
      mockUserService.updateAlias.mockRejectedValue(new UserDeletedException());
      await controller.updateAlias(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(403);
    });

    it('should return 404 when user not found', async () => {
      mockRequest = { params: { id: 'u1' }, body: { newAlias: 'alias1' } };
      mockUserService.updateAlias.mockRejectedValue(new UserNotFoundException());
      await controller.updateAlias(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('blockUser', () => {
    it('should return 200 on success', async () => {
      mockRequest = { params: { id: 'u1' } };
      await controller.blockUser(mockRequest as Request, mockResponse as Response);
      expect(mockUserService.block).toHaveBeenCalledWith('u1');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when missing id', async () => {
      mockRequest = { params: {} };
      await controller.blockUser(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when user not found', async () => {
      mockRequest = { params: { id: 'u1' } };
      mockUserService.block.mockRejectedValue(new UserNotFoundException());
      await controller.blockUser(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when user not active', async () => {
      mockRequest = { params: { id: 'u1' } };
      mockUserService.block.mockRejectedValue(new UserNotActiveException());
      await controller.blockUser(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });

    it('should return 409 when user already blocked', async () => {
      mockRequest = { params: { id: 'u1' } };
      mockUserService.block.mockRejectedValue(new UserAlreadyBlockedException());
      await controller.blockUser(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('unblockUser', () => {
    it('should return 200 on success', async () => {
      mockRequest = { params: { id: 'u1' } };
      await controller.unblockUser(mockRequest as Request, mockResponse as Response);
      expect(mockUserService.unblock).toHaveBeenCalledWith('u1');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when missing id', async () => {
      mockRequest = { params: {} };
      await controller.unblockUser(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when user not found', async () => {
      mockRequest = { params: { id: 'u1' } };
      mockUserService.unblock.mockRejectedValue(new UserNotFoundException());
      await controller.unblockUser(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when user not blocked', async () => {
      mockRequest = { params: { id: 'u1' } };
      mockUserService.unblock.mockRejectedValue(new UserNotBlockedException());
      await controller.unblockUser(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('deleteUser', () => {
    it('should return 200 on success', async () => {
      mockRequest = { params: { id: 'u1' } };
      await controller.deleteUser(mockRequest as Request, mockResponse as Response);
      expect(mockUserService.delete).toHaveBeenCalledWith('u1');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when missing id', async () => {
      mockRequest = { params: {} };
      await controller.deleteUser(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when user not found', async () => {
      mockRequest = { params: { id: 'u1' } };
      mockUserService.delete.mockRejectedValue(new UserNotFoundException());
      await controller.deleteUser(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when user already deleted', async () => {
      mockRequest = { params: { id: 'u1' } };
      mockUserService.delete.mockRejectedValue(new UserAlreadyDeletedException());
      await controller.deleteUser(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('restoreUser', () => {
    it('should return 200 on success', async () => {
      mockRequest = { params: { id: 'u1' }, body: { email: 'a@a.com' } };
      await controller.restoreUser(mockRequest as Request, mockResponse as Response);
      expect(mockUserService.restore).toHaveBeenCalledWith({ id: 'u1', email: 'a@a.com' });
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when missing body email', async () => {
      mockRequest = { params: { id: 'u1' }, body: {} };
      await controller.restoreUser(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when user not found', async () => {
      mockRequest = { params: { id: 'u1' }, body: { email: 'a@a.com' } };
      mockUserService.restore.mockRejectedValue(new UserNotFoundException());
      await controller.restoreUser(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when user not deleted', async () => {
      mockRequest = { params: { id: 'u1' }, body: { email: 'a@a.com' } };
      mockUserService.restore.mockRejectedValue(new UserNotDeletedException());
      await controller.restoreUser(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('getUserStats', () => {
    it('should return 200 on success', async () => {
      mockRequest = { params: { id: 'u1' } };
      mockTournamentResultsService.getStatsByUserId.mockResolvedValue({ wins: 1 });
      await controller.getUserStats(mockRequest as Request, mockResponse as Response);
      expect(mockTournamentResultsService.getStatsByUserId).toHaveBeenCalledWith('u1');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when missing id', async () => {
      mockRequest = { params: {} };
      await controller.getUserStats(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when user not found', async () => {
      mockRequest = { params: { id: 'u1' } };
      mockTournamentResultsService.getStatsByUserId.mockRejectedValue(new UserNotFoundException());
      await controller.getUserStats(mockRequest as Request, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });
});
