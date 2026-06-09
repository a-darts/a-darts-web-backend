import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

const mockService = vi.hoisted(() => ({
  getAllByTournamentId: vi.fn(),
  getById: vi.fn(),
  start: vi.fn(),
  finish: vi.fn(),
}));

vi.mock('../../../../infrastructure/factories/MatchServiceFactory.js', () => ({
  default: {
    getInstance: vi.fn(() => mockService),
  },
}));

import { MatchController } from '../../../../infrastructure/web/controllers/MatchController.js';
import { MissingRequiredUserFieldsException } from '../../../../domain/exceptions/UserExceptions.js';
import { TournamentNotFoundException } from '../../../../domain/exceptions/TournamentExceptions.js';
import { MatchNotFoundException, MatchNotPendingException } from '../../../../domain/exceptions/MatchExceptions.js';

describe('MatchController', () => {
  let controller: MatchController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: any;
  let mockStatus: any;

  beforeEach(() => {
    controller = new MatchController();

    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    mockResponse = {
      status: mockStatus,
    };

    vi.clearAllMocks();
  });

  describe('getMatchesByTournamentId', () => {
    it('should return 200 and matches successfully', async () => {
      mockRequest = {
        params: { id: 'tournament-id' },
      };

      const mockMatches = [{ id: 'match-id' }];
      mockService.getAllByTournamentId.mockResolvedValue(mockMatches);

      await controller.getMatchesByTournamentId(mockRequest as Request, mockResponse as Response);

      expect(mockService.getAllByTournamentId).toHaveBeenCalledWith('tournament-id');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Matches fetched successfully',
        data: mockMatches,
      });
    });

    it('should return 400 when id is missing', async () => {
      mockRequest = { params: {} };

      await controller.getMatchesByTournamentId(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new MissingRequiredUserFieldsException().message,
      });
    });

    it('should return 404 when tournament is not found', async () => {
      mockRequest = { params: { id: 't-id' } };
      mockService.getAllByTournamentId.mockRejectedValue(new TournamentNotFoundException());

      await controller.getMatchesByTournamentId(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new TournamentNotFoundException().message,
      });
    });
  });

  describe('getMatchById', () => {
    it('should return 200 and match successfully', async () => {
      mockRequest = { params: { id: 'match-id' } };
      
      const mockMatch = { id: 'match-id' };
      mockService.getById.mockResolvedValue(mockMatch);

      await controller.getMatchById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getById).toHaveBeenCalledWith('match-id');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Match fetched successfully',
        data: mockMatch,
      });
    });

    it('should return 404 when match is not found', async () => {
      mockRequest = { params: { id: 'match-id' } };
      mockService.getById.mockRejectedValue(new MatchNotFoundException());

      await controller.getMatchById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new MatchNotFoundException().message,
      });
    });
  });

  describe('startMatch', () => {
    it('should return 200 when match starts successfully', async () => {
      mockRequest = { params: { id: 'match-id' } };

      await controller.startMatch(mockRequest as Request, mockResponse as Response);

      expect(mockService.start).toHaveBeenCalledWith('match-id');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Match started successfully',
        data: null,
      });
    });

    it('should return 409 when match is not pending', async () => {
      mockRequest = { params: { id: 'match-id' } };
      mockService.start.mockRejectedValue(new MatchNotPendingException());

      await controller.startMatch(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new MatchNotPendingException().message,
      });
    });

    it('should return 500 on generic error', async () => {
      mockRequest = { params: { id: 'match-id' } };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockService.start.mockRejectedValue(new Error('Unknown'));

      await controller.startMatch(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error',
      });
      consoleSpy.mockRestore();
    });
  });
});
