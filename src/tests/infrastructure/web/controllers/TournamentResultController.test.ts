import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

const mockService = vi.hoisted(() => ({
  getByTournamentId: vi.fn(),
  getStatsByUserId: vi.fn(),
}));

vi.mock('../../../../infrastructure/factories/TournamentResultsServiceFactory.js', () => ({
  default: {
    getInstance: vi.fn(() => mockService),
  },
}));

import { TournamentResultController } from '../../../../infrastructure/web/controllers/TournamentResultController.js';
import { MissingRequiredUserFieldsException } from '../../../../domain/exceptions/UserExceptions.js';
import { TournamentNotFoundException } from '../../../../domain/exceptions/TournamentExceptions.js';
import { TournamentResultNotFoundException } from '../../../../domain/exceptions/TournamentResultException.js';

describe('TournamentResultController', () => {
  let controller: TournamentResultController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: any;
  let mockStatus: any;

  beforeEach(() => {
    controller = new TournamentResultController();

    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    mockResponse = {
      status: mockStatus,
    };

    vi.clearAllMocks();
  });

  describe('getTournamentResults', () => {
    it('should return 200 and the results when fetched successfully', async () => {
      mockRequest = {
        params: { id: 'tournament-id' },
      };

      const mockResults = { id: 'result-id' };
      mockService.getByTournamentId.mockResolvedValue(mockResults);

      await controller.getTournamentResults(mockRequest as Request, mockResponse as Response);

      expect(mockService.getByTournamentId).toHaveBeenCalledWith('tournament-id');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Tournament results fetched successfully',
        data: mockResults,
      });
    });

    it('should return 400 when id is missing', async () => {
      mockRequest = {
        params: {},
      };

      await controller.getTournamentResults(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new MissingRequiredUserFieldsException().message,
      });
    });

    it('should return 404 when tournament is not found', async () => {
      mockRequest = {
        params: { id: 'tournament-id' },
      };

      mockService.getByTournamentId.mockRejectedValue(new TournamentNotFoundException());

      await controller.getTournamentResults(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new TournamentNotFoundException().message,
      });
    });

    it('should return 404 when tournament result is not found', async () => {
      mockRequest = {
        params: { id: 'tournament-id' },
      };

      mockService.getByTournamentId.mockRejectedValue(new TournamentResultNotFoundException());

      await controller.getTournamentResults(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new TournamentResultNotFoundException().message,
      });
    });

    it('should return 500 for generic errors', async () => {
      mockRequest = {
        params: { id: 'tournament-id' },
      };

      // Suppress console.error for this test to avoid polluting the output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      mockService.getByTournamentId.mockRejectedValue(new Error('Some generic error'));

      await controller.getTournamentResults(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error',
      });

      consoleSpy.mockRestore();
    });
  });
});
