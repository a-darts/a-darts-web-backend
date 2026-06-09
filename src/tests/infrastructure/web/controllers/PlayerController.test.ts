import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { PlayerController } from '../../../../infrastructure/web/controllers/PlayerController.js';
import { MissingRequiredUserFieldsException, InvalidUserFieldsException, UserNotFoundException } from '../../../../domain/exceptions/UserExceptions.js';
import {
  PlayerNotFoundException,
  PlayerAlreadyExistsException,
  InvalidYearException,
  InvalidSeasonException,
  PlayerAlreadyDeletedException,
  PlayerNotDeletedException
} from '../../../../domain/exceptions/PlayerExceptions.js';
import { TournamentNotFoundException } from '../../../../domain/exceptions/TournamentExceptions.js';
import { PlayerStatus } from '../../../../domain/entities/Player.js';
import { AuthRequest } from '../../../../infrastructure/web/middlewares/authMiddleware.js';


const mockService = vi.hoisted(() => ({
  getAll: vi.fn(),
  getById: vi.fn(),
  getByUserIdAndSeason: vi.fn(),
  create: vi.fn(),
  updateFederation: vi.fn(),
  getUnregisteredPlayersInTournament: vi.fn(),
  delete: vi.fn(),
  restore: vi.fn(),
}));

vi.mock('../../../../infrastructure/factories/PlayerServiceFactory.js', () => ({
  default: {
    getInstance: vi.fn(() => mockService),
  },
}));


describe('PlayerController', () => {
  let controller: PlayerController;
  let mockRequest: Partial<AuthRequest>;
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

      await controller.getAllPlayers(mockRequest as AuthRequest, mockResponse as Response);

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

      await controller.getAllPlayers(mockRequest as AuthRequest, mockResponse as Response);

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

      await controller.getPlayerById(mockRequest as AuthRequest, mockResponse as Response);

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

      await controller.getPlayerById(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new MissingRequiredUserFieldsException().message,
      });
    });

    it('should return 404 when player is not found', async () => {
      mockRequest = { params: { id: 'player-id' } };
      mockService.getById.mockRejectedValue(new PlayerNotFoundException());

      await controller.getPlayerById(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new PlayerNotFoundException().message,
      });
    });

    it('should return 500 on generic error', async () => {
      mockRequest = { params: { id: 'player-id' } };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      mockService.getById.mockRejectedValue(new Error('Unknown'));

      await controller.getPlayerById(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error',
      });
      consoleSpy.mockRestore();
    });
  });

  describe('getPlayerByUserIdAndSeason', () => {
    it('should return 200 and player successfully', async () => {
      mockRequest = { params: { userId: 'u1', seasonStartYear: '2026' } };
      const mockPlayer = { id: 'player-id' };
      mockService.getByUserIdAndSeason.mockResolvedValue(mockPlayer);

      await controller.getPlayerByUserIdAndSeason(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockService.getByUserIdAndSeason).toHaveBeenCalledWith({ userId: 'u1', seasonStartYear: 2026 });
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when fields are missing', async () => {
      mockRequest = { params: { userId: 'u1' } };
      await controller.getPlayerByUserIdAndSeason(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when player not found', async () => {
      mockRequest = { params: { userId: 'u1', seasonStartYear: '2026' } };
      mockService.getByUserIdAndSeason.mockRejectedValue(new PlayerNotFoundException());

      await controller.getPlayerByUserIdAndSeason(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('createPlayer', () => {
    it('should return 201 when player created successfully', async () => {
      mockRequest = { body: { userId: 'u1', federation: 'FED', season: { startYear: 2026 } } };
      const mockPlayer = { id: 'p1' };
      mockService.create.mockResolvedValue(mockPlayer);

      await controller.createPlayer(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockService.create).toHaveBeenCalledWith(mockRequest.body);
      expect(mockStatus).toHaveBeenCalledWith(201);
    });

    it('should return 400 when fields are missing', async () => {
      mockRequest = { body: {} };
      mockService.create.mockRejectedValue(new MissingRequiredUserFieldsException());
      await controller.createPlayer(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 400 on invalid year', async () => {
      mockRequest = { body: {} };
      mockService.create.mockRejectedValue(new InvalidYearException());
      await controller.createPlayer(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 400 on invalid season', async () => {
      mockRequest = { body: {} };
      mockService.create.mockRejectedValue(new InvalidSeasonException());
      await controller.createPlayer(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when user not found', async () => {
      mockRequest = { body: {} };
      mockService.create.mockRejectedValue(new UserNotFoundException());
      await controller.createPlayer(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when player already exists', async () => {
      mockRequest = { body: {} };
      mockService.create.mockRejectedValue(new PlayerAlreadyExistsException());
      await controller.createPlayer(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('updatePlayerFederation', () => {
    it('should return 200 and update federation', async () => {
      mockRequest = { params: { id: 'p1' }, body: { newFederation: 'NEW_FED' } };
      await controller.updatePlayerFederation(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.updateFederation).toHaveBeenCalledWith({ id: 'p1', newFederation: 'NEW_FED' });
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when id is missing', async () => {
      mockRequest = { params: {}, body: { newFederation: 'NEW_FED' } };
      await controller.updatePlayerFederation(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 400 when newFederation is missing', async () => {
      mockRequest = { params: { id: 'p1' }, body: {} };
      await controller.updatePlayerFederation(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when player not found', async () => {
      mockRequest = { params: { id: 'p1' }, body: { newFederation: 'NEW_FED' } };
      mockService.updateFederation.mockRejectedValue(new PlayerNotFoundException());
      await controller.updatePlayerFederation(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('getUnregisteredPlayersByTournamentId', () => {
    it('should return 200 and unregistered players', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.getUnregisteredPlayersInTournament.mockResolvedValue([]);

      await controller.getUnregisteredPlayersByTournamentId(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockService.getUnregisteredPlayersInTournament).toHaveBeenCalledWith('t1');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when id is missing', async () => {
      mockRequest = { params: {} };
      await controller.getUnregisteredPlayersByTournamentId(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when tournament not found', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.getUnregisteredPlayersInTournament.mockRejectedValue(new TournamentNotFoundException());
      await controller.getUnregisteredPlayersByTournamentId(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('deletePlayer', () => {
    it('should return 200 and delete player', async () => {
      mockRequest = { params: { id: 'p1' } };
      await controller.deletePlayer(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.delete).toHaveBeenCalledWith('p1');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when id is missing', async () => {
      mockRequest = { params: {} };
      await controller.deletePlayer(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when player not found', async () => {
      mockRequest = { params: { id: 'p1' } };
      mockService.delete.mockRejectedValue(new PlayerNotFoundException());
      await controller.deletePlayer(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when player already deleted', async () => {
      mockRequest = { params: { id: 'p1' } };
      mockService.delete.mockRejectedValue(new PlayerAlreadyDeletedException());
      await controller.deletePlayer(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('restorePlayer', () => {
    it('should return 200 and restore player', async () => {
      mockRequest = { params: { id: 'p1' } };
      await controller.restorePlayer(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.restore).toHaveBeenCalledWith('p1');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when id is missing', async () => {
      mockRequest = { params: {} };
      await controller.restorePlayer(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when player not found', async () => {
      mockRequest = { params: { id: 'p1' } };
      mockService.restore.mockRejectedValue(new PlayerNotFoundException());
      await controller.restorePlayer(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when player not deleted', async () => {
      mockRequest = { params: { id: 'p1' } };
      mockService.restore.mockRejectedValue(new PlayerNotDeletedException());
      await controller.restorePlayer(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });
});
