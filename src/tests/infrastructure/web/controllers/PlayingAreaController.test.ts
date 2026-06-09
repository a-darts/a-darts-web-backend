import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

const mockService = vi.hoisted(() => ({
  getByTournamentId: vi.fn(),
  create: vi.fn(),
  releaseBoard: vi.fn(),
  disableBoard: vi.fn(),
  enableBoard: vi.fn(),
}));

vi.mock('../../../../infrastructure/factories/PlayingAreaServiceFactory.js', () => ({
  default: {
    getInstance: vi.fn(() => mockService),
  },
}));

import { PlayingAreaController } from '../../../../infrastructure/web/controllers/PlayingAreaController.js';
import { MissingRequiredUserFieldsException } from '../../../../domain/exceptions/UserExceptions.js';
import { TournamentNotFoundException } from '../../../../domain/exceptions/TournamentExceptions.js';
import { PlayingAreaNotFoundException, PlayingAreaAlreadyExistsException, BoardNotFoundException, BoardNotOccupiedException } from '../../../../domain/exceptions/PlayingAreaExceptions.js';

describe('PlayingAreaController', () => {
  let controller: PlayingAreaController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: any;
  let mockStatus: any;

  beforeEach(() => {
    controller = new PlayingAreaController();

    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    mockResponse = {
      status: mockStatus,
    };

    vi.clearAllMocks();
  });

  describe('getTournamentPlayingArea', () => {
    it('should return 200 and the playing area when fetched successfully', async () => {
      mockRequest = {
        params: { id: 'tournament-id' },
      };
      
      const mockArea = { id: 'area-id' };
      mockService.getByTournamentId.mockResolvedValue(mockArea);

      await controller.getTournamentPlayingArea(mockRequest as Request, mockResponse as Response);

      expect(mockService.getByTournamentId).toHaveBeenCalledWith('tournament-id');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Playing area fetched successfully',
        data: mockArea,
      });
    });

    it('should return 400 when id is missing', async () => {
      mockRequest = { params: {} };

      await controller.getTournamentPlayingArea(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new MissingRequiredUserFieldsException().message,
      });
    });

    it('should return 404 when tournament is not found', async () => {
      mockRequest = { params: { id: 't-id' } };
      mockService.getByTournamentId.mockRejectedValue(new TournamentNotFoundException());

      await controller.getTournamentPlayingArea(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new TournamentNotFoundException().message,
      });
    });
    
    it('should return 404 when playing area is not found', async () => {
      mockRequest = { params: { id: 't-id' } };
      mockService.getByTournamentId.mockRejectedValue(new PlayingAreaNotFoundException());

      await controller.getTournamentPlayingArea(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new PlayingAreaNotFoundException().message,
      });
    });
  });

  describe('createTournamentPlayingArea', () => {
    it('should return 200 when created successfully', async () => {
      mockRequest = {
        params: { id: 'tournament-id' },
        body: { numBoards: 4 },
      };
      
      const mockArea = { id: 'area-id', numBoards: 4 };
      mockService.create.mockResolvedValue(mockArea);

      await controller.createTournamentPlayingArea(mockRequest as Request, mockResponse as Response);

      expect(mockService.create).toHaveBeenCalledWith({ id: 'tournament-id', numBoards: 4 });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Playing area created successfully',
        data: mockArea,
      });
    });

    it('should return 400 when numBoards is missing', async () => {
      mockRequest = { params: { id: 't-id' }, body: {} };

      await controller.createTournamentPlayingArea(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new MissingRequiredUserFieldsException().message,
      });
    });

    it('should return 404 when playing area already exists', async () => {
      mockRequest = { params: { id: 't-id' }, body: { numBoards: 4 } };
      mockService.create.mockRejectedValue(new PlayingAreaAlreadyExistsException());

      await controller.createTournamentPlayingArea(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new PlayingAreaAlreadyExistsException().message,
      });
    });

    it('should return 500 on generic error', async () => {
      mockRequest = { params: { id: 't-id' }, body: { numBoards: 4 } };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockService.create.mockRejectedValue(new Error('Unknown error'));

      await controller.createTournamentPlayingArea(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error',
      });
      consoleSpy.mockRestore();
    });
  });

  describe('releasePlayingAreaBoard', () => {
    it('should return 200 when released successfully', async () => {
      mockRequest = {
        params: { id: 'area-id', boardId: 'board-id' },
      };

      await controller.releasePlayingAreaBoard(mockRequest as Request, mockResponse as Response);

      expect(mockService.releaseBoard).toHaveBeenCalledWith({ id: 'area-id', boardId: 'board-id' });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Board released successfully',
        data: null,
      });
    });

    it('should return 404 when board not found', async () => {
      mockRequest = { params: { id: 'area-id', boardId: 'board-id' } };
      mockService.releaseBoard.mockRejectedValue(new BoardNotFoundException());

      await controller.releasePlayingAreaBoard(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new BoardNotFoundException().message,
      });
    });

    it('should return 409 when board is not occupied', async () => {
      mockRequest = { params: { id: 'area-id', boardId: 'board-id' } };
      mockService.releaseBoard.mockRejectedValue(new BoardNotOccupiedException());

      await controller.releasePlayingAreaBoard(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new BoardNotOccupiedException().message,
      });
    });
  });
});
