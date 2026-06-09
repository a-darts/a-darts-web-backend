import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { AuthRequest } from '../../../../infrastructure/web/middlewares/authMiddleware.js';

const mockService = vi.hoisted(() => ({
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../../../../infrastructure/factories/TournamentServiceFactory.js', () => ({
  default: {
    getInstance: vi.fn(() => mockService),
  },
}));

import { TournamentController } from '../../../../infrastructure/web/controllers/TournamentController.js';
import { MissingRequiredUserFieldsException } from '../../../../domain/exceptions/UserExceptions.js';
import { TournamentNotFoundException, InvalidTournamentStatusException } from '../../../../domain/exceptions/TournamentExceptions.js';
import { UserRoles } from '../../../../domain/entities/User.js';
import { TournamentStatus } from '../../../../domain/entities/Tournament.js';

describe('TournamentController', () => {
  let controller: TournamentController;
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockJson: any;
  let mockStatus: any;

  beforeEach(() => {
    controller = new TournamentController();

    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    mockResponse = {
      status: mockStatus,
    };

    vi.clearAllMocks();
  });

  describe('getAllTournaments', () => {
    it('should return 200 and tournaments successfully', async () => {
      mockRequest = {
        query: { page: '1', limit: '10' },
        user: { role: UserRoles.ADMIN, id: 'admin-id' } as any,
      };

      const mockTournaments = { tournaments: [], pagination: { total: 0 } };
      mockService.getAll.mockResolvedValue(mockTournaments);

      await controller.getAllTournaments(mockRequest as Request, mockResponse as Response);

      expect(mockService.getAll).toHaveBeenCalledWith(1, 10, undefined, undefined, undefined);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Tournaments fetched successfully',
        data: mockTournaments,
      });
    });

    it('should return 400 for invalid page number', async () => {
      mockRequest = { query: { page: '-1' } };

      await controller.getAllTournaments(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid page number',
      });
    });

    it('should return 400 for invalid status', async () => {
      mockRequest = { query: { status: 'INVALID_STATUS' }, user: { role: UserRoles.ADMIN } as any };

      await controller.getAllTournaments(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new InvalidTournamentStatusException().message,
      });
    });
  });

  describe('getTournamentById', () => {
    it('should return 200 and tournament successfully', async () => {
      mockRequest = { params: { id: 'tournament-id' }, user: { role: UserRoles.ADMIN } as any };
      
      const mockTournament = { id: 'tournament-id', status: TournamentStatus.PUBLISHED };
      mockService.getById.mockResolvedValue(mockTournament);

      await controller.getTournamentById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getById).toHaveBeenCalledWith('tournament-id');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Tournament fetched successfully',
        data: mockTournament,
      });
    });

    it('should return 400 when id is missing', async () => {
      mockRequest = { params: {} };

      await controller.getTournamentById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new MissingRequiredUserFieldsException().message,
      });
    });

    it('should return 404 when tournament is not found', async () => {
      mockRequest = { params: { id: 'tournament-id' }, user: { role: UserRoles.ADMIN } as any };
      mockService.getById.mockRejectedValue(new TournamentNotFoundException());

      await controller.getTournamentById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new TournamentNotFoundException().message,
      });
    });

    it('should return 404 when getting a DRAFT tournament as non-admin', async () => {
      mockRequest = { params: { id: 'tournament-id' }, user: { role: UserRoles.PLAYER } as any };
      const mockTournament = { id: 'tournament-id', status: TournamentStatus.DRAFT };
      mockService.getById.mockResolvedValue(mockTournament);

      await controller.getTournamentById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new TournamentNotFoundException().message,
      });
    });
  });
});
