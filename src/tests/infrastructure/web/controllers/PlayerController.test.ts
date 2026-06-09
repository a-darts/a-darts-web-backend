import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

const mockService = vi.hoisted(() => ({
  getAll: vi.fn(),
  getById: vi.fn(),
  getByUserIdAndSeason: vi.fn(),
  create: vi.fn(),
  updateFederation: vi.fn(),
}));

vi.mock('../../../../infrastructure/factories/PlayerServiceFactory.js', () => ({
  default: {
    getInstance: vi.fn(() => mockService),
  },
}));

import { PlayerController } from '../../../../infrastructure/web/controllers/PlayerController.js';
import { MissingRequiredUserFieldsException } from '../../../../domain/exceptions/UserExceptions.js';
import { PlayerNotFoundException } from '../../../../domain/exceptions/PlayerExceptions.js';
import { PlayerStatus } from '../../../../domain/entities/Player.js';

describe('PlayerController', () => {
  let controller: PlayerController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: any;
  let mockStatus: any;

  beforeEach(() => {
    controller = new PlayerController();

    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    mockResponse = {
      status: mockStatus,
    };

    vi.clearAllMocks();
  });

  describe('getAllPlayers', () => {
    it('should return 200 and players successfully', async () => {
      mockRequest = {
        query: { page: '1', limit: '10', status: PlayerStatus.ACTIVE },
      };

      const mockPlayers = { players: [], pagination: { total: 0 } };
      mockService.getAll.mockResolvedValue(mockPlayers);

      await controller.getAllPlayers(mockRequest as Request, mockResponse as Response);

      expect(mockService.getAll).toHaveBeenCalledWith(1, 10, PlayerStatus.ACTIVE);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Players fetched successfully',
        data: mockPlayers,
      });
    });

    it('should return 400 for invalid page number', async () => {
      mockRequest = { query: { page: '-1' } };

      await controller.getAllPlayers(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid page number',
      });
    });
  });

  describe('getPlayerById', () => {
    it('should return 200 and player successfully', async () => {
      mockRequest = { params: { id: 'player-id' } };
      
      const mockPlayer = { id: 'player-id' };
      mockService.getById.mockResolvedValue(mockPlayer);

      await controller.getPlayerById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getById).toHaveBeenCalledWith('player-id');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Player data retrieved successfully',
        data: mockPlayer,
      });
    });

    it('should return 400 when id is missing', async () => {
      mockRequest = { params: {} };

      await controller.getPlayerById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new MissingRequiredUserFieldsException().message,
      });
    });

    it('should return 404 when player is not found', async () => {
      mockRequest = { params: { id: 'player-id' } };
      mockService.getById.mockRejectedValue(new PlayerNotFoundException());

      await controller.getPlayerById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new PlayerNotFoundException().message,
      });
    });

    it('should return 500 on generic error', async () => {
      mockRequest = { params: { id: 'player-id' } };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockService.getById.mockRejectedValue(new Error('Unknown'));

      await controller.getPlayerById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error',
      });
      consoleSpy.mockRestore();
    });
  });
});
