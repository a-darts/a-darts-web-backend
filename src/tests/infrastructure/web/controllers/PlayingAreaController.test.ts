import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { PlayingAreaController } from '../../../../infrastructure/web/controllers/PlayingAreaController.js';
import { MissingRequiredUserFieldsException } from '../../../../domain/exceptions/UserExceptions.js';
import { TournamentNotFoundException } from '../../../../domain/exceptions/TournamentExceptions.js';
import {
  PlayingAreaNotFoundException,
  PlayingAreaAlreadyExistsException,
  BoardNotFoundException,
  BoardNotOccupiedException,
  BoardNotAvailableException,
  BoardNotDisabledException,
  PlayingAreaHasNoBoardsException,
  BoardOccupiedException,
  BoardPairedWithTabletException
} from '../../../../domain/exceptions/PlayingAreaExceptions.js';
import { AuthRequest } from '../../../../infrastructure/web/middlewares/authMiddleware.js';


const mockService = vi.hoisted(() => ({
  getByTournamentId: vi.fn(),
  create: vi.fn(),
  releaseBoard: vi.fn(),
  disableBoard: vi.fn(),
  enableBoard: vi.fn(),
  addBoard: vi.fn(),
  removeLastBoard: vi.fn(),
}));

vi.mock('../../../../infrastructure/factories/PlayingAreaServiceFactory.js', () => ({
  default: {
    getInstance: vi.fn(() => mockService),
  },
}));


describe('PlayingAreaController', () => {
  let controller: PlayingAreaController;
  let mockRequest: Partial<AuthRequest>;
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

      await controller.getTournamentPlayingArea(mockRequest as AuthRequest, mockResponse as Response);

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

      await controller.getTournamentPlayingArea(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new MissingRequiredUserFieldsException().message,
      });
    });

    it('should return 404 when tournament is not found', async () => {
      mockRequest = { params: { id: 't-id' } };
      mockService.getByTournamentId.mockRejectedValue(new TournamentNotFoundException());

      await controller.getTournamentPlayingArea(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new TournamentNotFoundException().message,
      });
    });

    it('should return 404 when playing area is not found', async () => {
      mockRequest = { params: { id: 't-id' } };
      mockService.getByTournamentId.mockRejectedValue(new PlayingAreaNotFoundException());

      await controller.getTournamentPlayingArea(mockRequest as AuthRequest, mockResponse as Response);

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

      await controller.createTournamentPlayingArea(mockRequest as AuthRequest, mockResponse as Response);

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

      await controller.createTournamentPlayingArea(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new MissingRequiredUserFieldsException().message,
      });
    });

    it('should return 404 when playing area already exists', async () => {
      mockRequest = { params: { id: 't-id' }, body: { numBoards: 4 } };
      mockService.create.mockRejectedValue(new PlayingAreaAlreadyExistsException());

      await controller.createTournamentPlayingArea(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new PlayingAreaAlreadyExistsException().message,
      });
    });

    it('should return 500 on generic error', async () => {
      mockRequest = { params: { id: 't-id' }, body: { numBoards: 4 } };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      mockService.create.mockRejectedValue(new Error('Unknown error'));

      await controller.createTournamentPlayingArea(mockRequest as AuthRequest, mockResponse as Response);

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

      await controller.releasePlayingAreaBoard(mockRequest as AuthRequest, mockResponse as Response);

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

      await controller.releasePlayingAreaBoard(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new BoardNotFoundException().message,
      });
    });

    it('should return 409 when board is not occupied', async () => {
      mockRequest = { params: { id: 'area-id', boardId: 'board-id' } };
      mockService.releaseBoard.mockRejectedValue(new BoardNotOccupiedException());

      await controller.releasePlayingAreaBoard(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new BoardNotOccupiedException().message,
      });
    });
  });

  describe('disablePlayingAreaBoard', () => {
    it('should return 200 and disable board', async () => {
      mockRequest = { params: { id: 'area-id', boardId: 'board-id' } };
      await controller.disablePlayingAreaBoard(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.disableBoard).toHaveBeenCalledWith({ id: 'area-id', boardId: 'board-id' });
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when fields missing', async () => {
      mockRequest = { params: { id: 'area-id' } };
      await controller.disablePlayingAreaBoard(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when area or board not found', async () => {
      mockRequest = { params: { id: 'area-id', boardId: 'board-id' } };
      mockService.disableBoard.mockRejectedValue(new PlayingAreaNotFoundException());
      await controller.disablePlayingAreaBoard(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when board is not available', async () => {
      mockRequest = { params: { id: 'area-id', boardId: 'board-id' } };
      mockService.disableBoard.mockRejectedValue(new BoardNotAvailableException());
      await controller.disablePlayingAreaBoard(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('enablePlayingAreaBoard', () => {
    it('should return 200 and enable board', async () => {
      mockRequest = { params: { id: 'area-id', boardId: 'board-id' } };
      await controller.enablePlayingAreaBoard(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.enableBoard).toHaveBeenCalledWith({ id: 'area-id', boardId: 'board-id' });
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when fields missing', async () => {
      mockRequest = { params: { id: 'area-id' } };
      await controller.enablePlayingAreaBoard(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when area or board not found', async () => {
      mockRequest = { params: { id: 'area-id', boardId: 'board-id' } };
      mockService.enableBoard.mockRejectedValue(new BoardNotFoundException());
      await controller.enablePlayingAreaBoard(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when board is not disabled', async () => {
      mockRequest = { params: { id: 'area-id', boardId: 'board-id' } };
      mockService.enableBoard.mockRejectedValue(new BoardNotDisabledException());
      await controller.enablePlayingAreaBoard(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('addBoardInPlayingArea', () => {
    it('should return 200 and add board', async () => {
      mockRequest = { params: { id: 'area-id' } };
      await controller.addBoardInPlayingArea(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.addBoard).toHaveBeenCalledWith('area-id');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when id missing', async () => {
      mockRequest = { params: {} };
      await controller.addBoardInPlayingArea(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when area not found', async () => {
      mockRequest = { params: { id: 'area-id' } };
      mockService.addBoard.mockRejectedValue(new PlayingAreaNotFoundException());
      await controller.addBoardInPlayingArea(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('removeLastBoardFromPlayingArea', () => {
    it('should return 200 and remove last board', async () => {
      mockRequest = { params: { id: 'area-id' } };
      await controller.removeLastBoardFromPlayingArea(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.removeLastBoard).toHaveBeenCalledWith('area-id');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when id missing', async () => {
      mockRequest = { params: {} };
      await controller.removeLastBoardFromPlayingArea(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when area not found', async () => {
      mockRequest = { params: { id: 'area-id' } };
      mockService.removeLastBoard.mockRejectedValue(new PlayingAreaNotFoundException());
      await controller.removeLastBoardFromPlayingArea(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when no boards or occupied', async () => {
      mockRequest = { params: { id: 'area-id' } };
      mockService.removeLastBoard.mockRejectedValue(new PlayingAreaHasNoBoardsException());
      await controller.removeLastBoardFromPlayingArea(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });
});
