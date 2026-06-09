import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

const mockService = vi.hoisted(() => ({
  createAutomatically: vi.fn(),
  createManually: vi.fn(),
  getByTournamentId: vi.fn(),
  assignParticipantToBracketPosition: vi.fn(),
}));

vi.mock('../../../../infrastructure/factories/BracketServiceFactory.js', () => ({
  default: {
    getInstance: vi.fn(() => mockService),
  },
}));

import { BracketController } from '../../../../infrastructure/web/controllers/BracketController.js';
import { MissingRequiredUserFieldsException } from '../../../../domain/exceptions/UserExceptions.js';
import { TournamentNotFoundException, TournamentAlreadyHasBracketException, TournamentNotPublishedException } from '../../../../domain/exceptions/TournamentExceptions.js';
import { RegistratedParticipantsEmptyException } from '../../../../domain/exceptions/ParticipantExceptions.js';

describe('BracketController', () => {
  let controller: BracketController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: any;
  let mockStatus: any;

  beforeEach(() => {
    controller = new BracketController();

    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    mockResponse = {
      status: mockStatus,
    };

    vi.clearAllMocks();
  });

  describe('createBracketAutomatically', () => {
    it('should return 201 when bracket is created automatically', async () => {
      mockRequest = {
        params: { id: 'tournament-id' },
      };

      const mockBracket = { id: 'bracket-id' };
      mockService.createAutomatically.mockResolvedValue(mockBracket);

      await controller.createBracketAutomatically(mockRequest as Request, mockResponse as Response);

      expect(mockService.createAutomatically).toHaveBeenCalledWith({ id: 'tournament-id' });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Bracket automatically created successfully',
        data: mockBracket,
      });
    });

    it('should return 400 when id is missing', async () => {
      mockRequest = { params: {} };

      await controller.createBracketAutomatically(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new MissingRequiredUserFieldsException().message,
      });
    });

    it('should return 404 when tournament is not found', async () => {
      mockRequest = { params: { id: 't-id' } };
      mockService.createAutomatically.mockRejectedValue(new TournamentNotFoundException());

      await controller.createBracketAutomatically(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new TournamentNotFoundException().message,
      });
    });

    it('should return 409 when there are no registered participants', async () => {
      mockRequest = { params: { id: 't-id' } };
      mockService.createAutomatically.mockRejectedValue(new RegistratedParticipantsEmptyException());

      await controller.createBracketAutomatically(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new RegistratedParticipantsEmptyException().message,
      });
    });

    it('should return 409 when tournament already has a bracket', async () => {
      mockRequest = { params: { id: 't-id' } };
      mockService.createAutomatically.mockRejectedValue(new TournamentAlreadyHasBracketException());

      await controller.createBracketAutomatically(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new TournamentAlreadyHasBracketException().message,
      });
    });
  });

  describe('createBracketManually', () => {
    it('should return 201 when bracket is created manually', async () => {
      mockRequest = {
        params: { id: 'tournament-id' },
      };

      const mockBracket = { id: 'bracket-id' };
      mockService.createManually.mockResolvedValue(mockBracket);

      await controller.createBracketManually(mockRequest as Request, mockResponse as Response);

      expect(mockService.createManually).toHaveBeenCalledWith({ id: 'tournament-id' });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Bracket manually created successfully',
        data: mockBracket,
      });
    });

    it('should return 409 when tournament is not published', async () => {
      mockRequest = { params: { id: 't-id' } };
      mockService.createManually.mockRejectedValue(new TournamentNotPublishedException());

      await controller.createBracketManually(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new TournamentNotPublishedException().message,
      });
    });

    it('should return 500 on generic error', async () => {
      mockRequest = { params: { id: 't-id' } };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockService.createManually.mockRejectedValue(new Error('Unknown error'));

      await controller.createBracketManually(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error',
      });
      consoleSpy.mockRestore();
    });
  });
});
